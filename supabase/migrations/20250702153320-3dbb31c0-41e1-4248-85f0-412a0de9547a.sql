-- Add missing columns to existing tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS tournament_type TEXT CHECK (tournament_type IN ('single_elimination', 'double_elimination', 'round_robin', 'handicap')) DEFAULT 'single_elimination',
ADD COLUMN IF NOT EXISTS game_format TEXT CHECK (game_format IN ('8_ball', '9_ball', '10_ball', 'straight_pool')) DEFAULT '8_ball',
ADD COLUMN IF NOT EXISTS registration_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS entry_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS prize_pool DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_prize DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS second_prize DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS third_prize DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 16,
ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank_requirement TEXT[],
ADD COLUMN IF NOT EXISTS min_trust_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS venue_address TEXT,
ADD COLUMN IF NOT EXISTS rules TEXT,
ADD COLUMN IF NOT EXISTS banner_image TEXT,
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Create tournament registrations table
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_status TEXT CHECK (registration_status IN ('pending', 'confirmed', 'cancelled', 'withdrawn')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'paid', 'refunded')) DEFAULT 'unpaid',
  seed_number INTEGER,
  notes TEXT,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tournament_id, player_id)
);

-- Create tournament matches table
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES auth.users(id),
  player2_id UUID REFERENCES auth.users(id),
  score_player1 INTEGER DEFAULT 0,
  score_player2 INTEGER DEFAULT 0,
  winner_id UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')) DEFAULT 'scheduled',
  scheduled_time TIMESTAMP WITH TIME ZONE,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tournament results table
CREATE TABLE IF NOT EXISTS public.tournament_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  final_position INTEGER NOT NULL,
  elo_points_earned INTEGER DEFAULT 0,
  prize_money DECIMAL(10,2) DEFAULT 0,
  performance_rating DECIMAL(5,2),
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tournament_id, player_id)
);

-- Enable Row Level Security on new tables
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;

-- Tournament registration policies
CREATE POLICY "Everyone can view tournament registrations" 
ON public.tournament_registrations 
FOR SELECT 
USING (true);

CREATE POLICY "Players can register for tournaments" 
ON public.tournament_registrations 
FOR INSERT 
WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update their own registrations" 
ON public.tournament_registrations 
FOR UPDATE 
USING (auth.uid() = player_id);

CREATE POLICY "Club owners can manage registrations for their tournaments" 
ON public.tournament_registrations 
FOR ALL 
USING (auth.uid() IN (
  SELECT cp.user_id FROM public.club_profiles cp
  JOIN public.tournaments t ON t.club_id = cp.id
  WHERE t.id = tournament_registrations.tournament_id
));

-- Tournament match policies
CREATE POLICY "Everyone can view tournament matches" 
ON public.tournament_matches 
FOR SELECT 
USING (true);

CREATE POLICY "Players can update their match results" 
ON public.tournament_matches 
FOR UPDATE 
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Club owners can manage matches for their tournaments" 
ON public.tournament_matches 
FOR ALL 
USING (auth.uid() IN (
  SELECT cp.user_id FROM public.club_profiles cp
  JOIN public.tournaments t ON t.club_id = cp.id
  WHERE t.id = tournament_matches.tournament_id
));

-- Tournament results policies
CREATE POLICY "Everyone can view tournament results" 
ON public.tournament_results 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage tournament results" 
ON public.tournament_results 
FOR ALL 
USING (true);

-- Add club owner policy for tournaments
DROP POLICY IF EXISTS "Club owners can manage their tournaments" ON public.tournaments;
CREATE POLICY "Club owners can manage their tournaments" 
ON public.tournaments 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM public.club_profiles WHERE id = tournaments.club_id
));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_club_id ON public.tournaments(club_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON public.tournaments(start_date);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON public.tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_player_id ON public.tournament_registrations(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id ON public.tournament_results(tournament_id);

-- Create triggers for updated_at
CREATE TRIGGER update_tournament_registrations_updated_at
BEFORE UPDATE ON public.tournament_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_matches_updated_at
BEFORE UPDATE ON public.tournament_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update tournament participant count
CREATE OR REPLACE FUNCTION public.update_tournament_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.registration_status = 'confirmed' THEN
    UPDATE public.tournaments 
    SET current_participants = current_participants + 1
    WHERE id = NEW.tournament_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If status changed from confirmed to something else
    IF OLD.registration_status = 'confirmed' AND NEW.registration_status != 'confirmed' THEN
      UPDATE public.tournaments 
      SET current_participants = current_participants - 1
      WHERE id = NEW.tournament_id;
    -- If status changed to confirmed from something else
    ELSIF OLD.registration_status != 'confirmed' AND NEW.registration_status = 'confirmed' THEN
      UPDATE public.tournaments 
      SET current_participants = current_participants + 1
      WHERE id = NEW.tournament_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.registration_status = 'confirmed' THEN
    UPDATE public.tournaments 
    SET current_participants = current_participants - 1
    WHERE id = OLD.tournament_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to update participant count
DROP TRIGGER IF EXISTS trigger_update_tournament_participant_count ON public.tournament_registrations;
CREATE TRIGGER trigger_update_tournament_participant_count
AFTER INSERT OR UPDATE OR DELETE ON public.tournament_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_tournament_participant_count();

-- Function to create tournament notifications
CREATE OR REPLACE FUNCTION public.notify_tournament_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tournament_name TEXT;
  player_name TEXT;
BEGIN
  -- Get tournament and player names
  SELECT name INTO tournament_name FROM public.tournaments WHERE id = NEW.tournament_id;
  SELECT full_name INTO player_name FROM public.profiles WHERE user_id = NEW.player_id;
  
  -- Notify tournament organizer about new registration
  PERFORM public.create_notification(
    (SELECT cp.user_id FROM public.club_profiles cp
     JOIN public.tournaments t ON t.club_id = cp.id
     WHERE t.id = NEW.tournament_id),
    'tournament_registration',
    'Đăng ký giải đấu mới',
    format('%s đã đăng ký tham gia giải đấu "%s"', 
           COALESCE(player_name, 'Người chơi'), 
           COALESCE(tournament_name, 'Giải đấu')),
    format('/tournaments/%s', NEW.tournament_id),
    jsonb_build_object(
      'tournament_id', NEW.tournament_id,
      'player_id', NEW.player_id,
      'registration_id', NEW.id
    ),
    'normal'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for tournament registration notifications
DROP TRIGGER IF EXISTS trigger_notify_tournament_registration ON public.tournament_registrations;
CREATE TRIGGER trigger_notify_tournament_registration
AFTER INSERT ON public.tournament_registrations
FOR EACH ROW
EXECUTE FUNCTION public.notify_tournament_registration();

-- Enable realtime for tournament tables
ALTER TABLE public.tournaments REPLICA IDENTITY FULL;
ALTER TABLE public.tournament_registrations REPLICA IDENTITY FULL;
ALTER TABLE public.tournament_matches REPLICA IDENTITY FULL;
ALTER TABLE public.tournament_results REPLICA IDENTITY FULL;

ALTER publication supabase_realtime ADD TABLE public.tournament_registrations;
ALTER publication supabase_realtime ADD TABLE public.tournament_matches;
ALTER publication supabase_realtime ADD TABLE public.tournament_results;