-- Add trust_score column to player_rankings if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'player_rankings' AND column_name = 'trust_score') THEN
    ALTER TABLE public.player_rankings ADD COLUMN trust_score DECIMAL DEFAULT 50.0;
  END IF;
END $$;

-- Add trust_score column to club_profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'club_profiles' AND column_name = 'trust_score') THEN
    ALTER TABLE public.club_profiles ADD COLUMN trust_score DECIMAL DEFAULT 80.0;
  END IF;
END $$;

-- Create comprehensive trust score calculation function
CREATE OR REPLACE FUNCTION public.calculate_trust_score(entity_type TEXT, entity_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  rating_score DECIMAL := 0;
  activity_score DECIMAL := 0;
  reliability_score DECIMAL := 0;
  final_trust_score DECIMAL := 0;
BEGIN
  -- Component 1: Average rating score (40% weight)
  SELECT COALESCE(AVG(rating) * 20, 0) INTO rating_score -- Convert 1-5 scale to 0-100
  FROM public.mutual_ratings 
  WHERE rated_entity_type = entity_type 
  AND rated_entity_id = entity_id
  AND created_at > NOW() - INTERVAL '6 months'; -- Recent ratings only
  
  IF entity_type = 'user' THEN
    -- Component 2: Activity score for users (30% weight)
    SELECT LEAST(COUNT(*) * 5, 100) INTO activity_score -- Cap at 100%
    FROM public.challenges 
    WHERE (challenger_id = entity_id OR opponent_id = entity_id)
    AND club_confirmed = true
    AND created_at > NOW() - INTERVAL '3 months';
    
    -- Component 3: Reliability score for users (30% weight)
    SELECT CASE 
      WHEN total_challenges = 0 THEN 50 -- Default for new users
      ELSE LEAST((completed_challenges * 100.0 / total_challenges), 100)
    END INTO reliability_score
    FROM (
      SELECT 
        COUNT(*) as total_challenges,
        COUNT(CASE WHEN club_confirmed = true THEN 1 END) as completed_challenges
      FROM public.challenges 
      WHERE (challenger_id = entity_id OR opponent_id = entity_id)
      AND created_at > NOW() - INTERVAL '6 months'
    ) stats;
    
  ELSIF entity_type = 'club' THEN
    -- Component 2: Service quality for clubs (30% weight)
    SELECT COALESCE(LEAST(COUNT(*) * 3, 100), 0) INTO activity_score -- Matches confirmed
    FROM public.challenges 
    WHERE club_id = entity_id 
    AND club_confirmed = true
    AND created_at > NOW() - INTERVAL '1 month';
    
    -- Component 3: Club reliability (30% weight)  
    SELECT CASE
      WHEN total_requests = 0 THEN 80 -- Default for new clubs
      ELSE LEAST((processed_requests * 100.0 / total_requests), 100)
    END INTO reliability_score
    FROM (
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN club_confirmed IS NOT NULL THEN 1 END) as processed_requests
      FROM public.challenges 
      WHERE club_id = entity_id
      AND created_at > NOW() - INTERVAL '3 months'
    ) stats;
  END IF;
  
  -- Final weighted calculation
  final_trust_score := (rating_score * 0.4) + (activity_score * 0.3) + (reliability_score * 0.3);
  
  RETURN LEAST(final_trust_score, 100.0); -- Cap at 100%
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate club's average member trust score
CREATE OR REPLACE FUNCTION public.calculate_club_average_trust(club_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  avg_trust DECIMAL := 0;
BEGIN
  -- Get average trust score from club challenges (since we don't have club_members table)
  SELECT COALESCE(AVG(COALESCE(pr.trust_score, 50)), 0) INTO avg_trust
  FROM (
    SELECT DISTINCT challenger_id as user_id FROM public.challenges WHERE club_id = club_uuid
    UNION
    SELECT DISTINCT opponent_id as user_id FROM public.challenges WHERE club_id = club_uuid AND opponent_id IS NOT NULL
  ) club_users
  LEFT JOIN public.player_rankings pr ON pr.user_id = club_users.user_id
  WHERE club_users.user_id IS NOT NULL;
  
  RETURN ROUND(COALESCE(avg_trust, 0), 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to auto-update trust scores when ratings are submitted
CREATE OR REPLACE FUNCTION public.update_trust_scores_on_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the rated entity's trust score
  IF NEW.rated_entity_type = 'user' THEN
    UPDATE public.player_rankings 
    SET trust_score = public.calculate_trust_score('user', NEW.rated_entity_id),
        updated_at = NOW()
    WHERE user_id = NEW.rated_entity_id;
    
  ELSIF NEW.rated_entity_type = 'club' THEN
    UPDATE public.club_profiles 
    SET trust_score = public.calculate_trust_score('club', NEW.rated_entity_id),
        updated_at = NOW()
    WHERE id = NEW.rated_entity_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-updating trust scores
DROP TRIGGER IF EXISTS update_trust_scores_trigger ON public.mutual_ratings;
CREATE TRIGGER update_trust_scores_trigger
  AFTER INSERT ON public.mutual_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trust_scores_on_rating();