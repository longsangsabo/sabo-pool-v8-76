-- Create match_ratings table for post-match player ratings
CREATE TABLE public.match_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_assessment TEXT CHECK (skill_assessment IN ('accurate', 'higher_than_registered', 'lower_than_registered')) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, rater_id, rated_player_id)
);

-- Create user_penalties table for tracking penalties
CREATE TABLE public.user_penalties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  penalty_type TEXT CHECK (penalty_type IN ('warning', 'match_restriction', 'temporary_ban', 'permanent_ban')) NOT NULL,
  severity TEXT CHECK (severity IN ('minor', 'major', 'severe')) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  reason TEXT NOT NULL,
  issued_by UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('active', 'expired', 'appealed', 'overturned')) DEFAULT 'active',
  appeal_reason TEXT,
  appeal_date TIMESTAMP WITH TIME ZONE,
  appeal_reviewed_by UUID REFERENCES auth.users(id),
  appeal_decision TEXT CHECK (appeal_decision IN ('approved', 'rejected')),
  appeal_decision_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create player_trust_scores table for trust metrics
CREATE TABLE public.player_trust_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_ratings INTEGER DEFAULT 0,
  positive_ratings INTEGER DEFAULT 0,
  trust_percentage DECIMAL(5,2) DEFAULT 100.00,
  flag_status TEXT CHECK (flag_status IN ('none', 'yellow', 'red')) DEFAULT 'none',
  negative_reports_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create club_accountability table for tracking club verification accuracy
CREATE TABLE public.club_accountability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.club_profiles(id) ON DELETE CASCADE UNIQUE,
  total_verifications INTEGER DEFAULT 0,
  false_verification_reports INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 100.00,
  warning_count INTEGER DEFAULT 0,
  restriction_status TEXT CHECK (restriction_status IN ('active', 'warned', 'restricted')) DEFAULT 'active',
  restriction_start_date TIMESTAMP WITH TIME ZONE,
  restriction_end_date TIMESTAMP WITH TIME ZONE,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.match_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_accountability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for match_ratings
CREATE POLICY "Users can view ratings where they're involved" 
ON public.match_ratings FOR SELECT 
USING (auth.uid() = rater_id OR auth.uid() = rated_player_id);

CREATE POLICY "Users can create ratings for matches they participated in" 
ON public.match_ratings FOR INSERT 
WITH CHECK (
  auth.uid() = rater_id 
  AND EXISTS (
    SELECT 1 FROM public.matches 
    WHERE id = match_id 
    AND (player1_id = auth.uid() OR player2_id = auth.uid())
  )
);

-- RLS Policies for user_penalties
CREATE POLICY "Users can view their own penalties" 
ON public.user_penalties FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own penalty appeals" 
ON public.user_penalties FOR UPDATE 
USING (auth.uid() = user_id AND appeal_reason IS NULL);

-- RLS Policies for player_trust_scores
CREATE POLICY "Anyone can view trust scores" 
ON public.player_trust_scores FOR SELECT 
USING (true);

-- RLS Policies for club_accountability
CREATE POLICY "Anyone can view club accountability" 
ON public.club_accountability FOR SELECT 
USING (true);

CREATE POLICY "Club owners can view their club's accountability" 
ON public.club_accountability FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.club_profiles WHERE id = club_id
  )
);

-- Create indexes for better performance
CREATE INDEX idx_match_ratings_match_id ON public.match_ratings(match_id);
CREATE INDEX idx_match_ratings_rated_player_id ON public.match_ratings(rated_player_id);
CREATE INDEX idx_user_penalties_user_id ON public.user_penalties(user_id);
CREATE INDEX idx_user_penalties_status ON public.user_penalties(status);
CREATE INDEX idx_player_trust_scores_player_id ON public.player_trust_scores(player_id);
CREATE INDEX idx_player_trust_scores_trust_percentage ON public.player_trust_scores(trust_percentage);
CREATE INDEX idx_club_accountability_club_id ON public.club_accountability(club_id);

-- Create triggers for updated_at
CREATE TRIGGER update_user_penalties_updated_at
  BEFORE UPDATE ON public.user_penalties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_trust_scores_updated_at
  BEFORE UPDATE ON public.player_trust_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_club_accountability_updated_at
  BEFORE UPDATE ON public.club_accountability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate trust score
CREATE OR REPLACE FUNCTION public.calculate_trust_score(player_uuid UUID)
RETURNS VOID AS $$
DECLARE
  total_count INTEGER;
  positive_count INTEGER;
  negative_count INTEGER;
  trust_pct DECIMAL(5,2);
  flag_stat TEXT;
BEGIN
  -- Count ratings for this player
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE skill_assessment = 'accurate'),
    COUNT(*) FILTER (WHERE skill_assessment IN ('higher_than_registered', 'lower_than_registered'))
  INTO total_count, positive_count, negative_count
  FROM public.match_ratings 
  WHERE rated_player_id = player_uuid;

  -- Calculate trust percentage
  IF total_count = 0 THEN
    trust_pct := 100.00;
  ELSE
    trust_pct := (positive_count::DECIMAL / total_count::DECIMAL) * 100;
  END IF;

  -- Determine flag status
  IF negative_count >= 5 THEN
    flag_stat := 'red';
  ELSIF negative_count >= 3 THEN
    flag_stat := 'yellow';
  ELSE
    flag_stat := 'none';
  END IF;

  -- Insert or update trust score
  INSERT INTO public.player_trust_scores (
    player_id, total_ratings, positive_ratings, trust_percentage, 
    flag_status, negative_reports_count, last_calculated_at
  )
  VALUES (
    player_uuid, total_count, positive_count, trust_pct, 
    flag_stat, negative_count, now()
  )
  ON CONFLICT (player_id) DO UPDATE SET
    total_ratings = EXCLUDED.total_ratings,
    positive_ratings = EXCLUDED.positive_ratings,
    trust_percentage = EXCLUDED.trust_percentage,
    flag_status = EXCLUDED.flag_status,
    negative_reports_count = EXCLUDED.negative_reports_count,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply automatic penalties
CREATE OR REPLACE FUNCTION public.apply_automatic_penalty(player_uuid UUID)
RETURNS VOID AS $$
DECLARE
  penalty_count INTEGER;
  penalty_type_var TEXT;
  penalty_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Count existing penalties for this player
  SELECT COUNT(*) INTO penalty_count
  FROM public.user_penalties
  WHERE user_id = player_uuid 
  AND penalty_type IN ('warning', 'match_restriction', 'temporary_ban', 'permanent_ban')
  AND status = 'active';

  -- Determine penalty type and duration
  CASE penalty_count
    WHEN 0 THEN
      penalty_type_var := 'warning';
      penalty_end_date := now() + INTERVAL '7 days';
    WHEN 1 THEN
      penalty_type_var := 'temporary_ban';
      penalty_end_date := now() + INTERVAL '30 days';
    ELSE
      penalty_type_var := 'permanent_ban';
      penalty_end_date := NULL;
  END CASE;

  -- Insert new penalty
  INSERT INTO public.user_penalties (
    user_id, penalty_type, severity, end_date, reason, issued_by
  )
  VALUES (
    player_uuid, penalty_type_var, 'major', penalty_end_date,
    'Automatic penalty due to multiple negative skill assessments',
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to update trust scores after match rating
CREATE OR REPLACE FUNCTION public.update_trust_after_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update trust score for the rated player
  PERFORM public.calculate_trust_score(NEW.rated_player_id);
  
  -- Check if automatic penalty should be applied (red flag)
  IF (SELECT flag_status FROM public.player_trust_scores WHERE player_id = NEW.rated_player_id) = 'red' THEN
    PERFORM public.apply_automatic_penalty(NEW.rated_player_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic trust score updates
CREATE TRIGGER update_trust_score_after_rating
  AFTER INSERT ON public.match_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trust_after_rating();