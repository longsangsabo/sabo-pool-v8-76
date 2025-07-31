-- Create player_stats table for tracking detailed statistics
CREATE TABLE IF NOT EXISTS public.player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  total_points_won INTEGER DEFAULT 0,
  total_points_lost INTEGER DEFAULT 0,
  last_match_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_id)
);

-- Create leaderboard table for monthly rankings
CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  city TEXT,
  district TEXT,
  rank_category TEXT,
  total_wins INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  ranking_points INTEGER DEFAULT 0,
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_id, month, year)
);

-- Create club_stats table for club dashboard
CREATE TABLE IF NOT EXISTS public.club_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES club_profiles(id) ON DELETE CASCADE,
  active_members INTEGER DEFAULT 0,
  verified_members INTEGER DEFAULT 0,
  avg_trust_score DECIMAL(5,2) DEFAULT 0.00,
  total_matches_hosted INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0.00,
  peak_hours JSONB DEFAULT '{}',
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(club_id, month, year)
);

-- Create favorite_opponents table
CREATE TABLE IF NOT EXISTS public.favorite_opponents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matches_count INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  last_played TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_id, opponent_id)
);

-- Enable RLS
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_opponents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for player_stats
CREATE POLICY "Users can view all player stats" ON public.player_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own stats" ON public.player_stats
  FOR ALL USING (auth.uid() = player_id);

-- RLS Policies for leaderboards
CREATE POLICY "Everyone can view leaderboards" ON public.leaderboards
  FOR SELECT USING (true);

CREATE POLICY "System can manage leaderboards" ON public.leaderboards
  FOR ALL USING (true);

-- RLS Policies for club_stats
CREATE POLICY "Everyone can view club stats" ON public.club_stats
  FOR SELECT USING (true);

CREATE POLICY "Club owners can manage their stats" ON public.club_stats
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM club_profiles WHERE id = club_stats.club_id
    )
  );

-- RLS Policies for favorite_opponents
CREATE POLICY "Users can view their favorite opponents" ON public.favorite_opponents
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can manage their favorite opponents" ON public.favorite_opponents
  FOR ALL USING (auth.uid() = player_id);

-- Function to update player stats when match is completed
CREATE OR REPLACE FUNCTION update_player_stats_on_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  winner_stats RECORD;
  loser_stats RECORD;
  loser_id UUID;
BEGIN
  -- Only process completed matches
  IF NEW.status != 'completed' OR NEW.winner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine loser
  loser_id := CASE 
    WHEN NEW.winner_id = NEW.player1_id THEN NEW.player2_id
    ELSE NEW.player1_id
  END;

  -- Update winner stats
  INSERT INTO public.player_stats (player_id, matches_played, matches_won, last_match_date)
  VALUES (NEW.winner_id, 1, 1, NEW.played_at)
  ON CONFLICT (player_id) DO UPDATE SET
    matches_played = player_stats.matches_played + 1,
    matches_won = player_stats.matches_won + 1,
    current_streak = CASE 
      WHEN player_stats.last_match_date < NEW.played_at THEN player_stats.current_streak + 1
      ELSE player_stats.current_streak
    END,
    longest_streak = GREATEST(player_stats.longest_streak, 
      CASE 
        WHEN player_stats.last_match_date < NEW.played_at THEN player_stats.current_streak + 1
        ELSE player_stats.current_streak
      END),
    win_rate = ROUND((player_stats.matches_won + 1.0) / (player_stats.matches_played + 1.0) * 100, 2),
    last_match_date = NEW.played_at,
    updated_at = now();

  -- Update loser stats
  INSERT INTO public.player_stats (player_id, matches_played, matches_lost, last_match_date)
  VALUES (loser_id, 1, 1, NEW.played_at)
  ON CONFLICT (player_id) DO UPDATE SET
    matches_played = player_stats.matches_played + 1,
    matches_lost = player_stats.matches_lost + 1,
    current_streak = 0,
    win_rate = ROUND(player_stats.matches_won / (player_stats.matches_played + 1.0) * 100, 2),
    last_match_date = NEW.played_at,
    updated_at = now();

  -- Update favorite opponents
  INSERT INTO public.favorite_opponents (player_id, opponent_id, matches_count, wins, last_played)
  VALUES (NEW.winner_id, loser_id, 1, 1, NEW.played_at)
  ON CONFLICT (player_id, opponent_id) DO UPDATE SET
    matches_count = favorite_opponents.matches_count + 1,
    wins = favorite_opponents.wins + 1,
    last_played = NEW.played_at,
    updated_at = now();

  INSERT INTO public.favorite_opponents (player_id, opponent_id, matches_count, losses, last_played)
  VALUES (loser_id, NEW.winner_id, 1, 1, NEW.played_at)
  ON CONFLICT (player_id, opponent_id) DO UPDATE SET
    matches_count = favorite_opponents.matches_count + 1,
    losses = favorite_opponents.losses + 1,
    last_played = NEW.played_at,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Trigger for match completion
CREATE OR REPLACE TRIGGER update_stats_on_match_completion
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION update_player_stats_on_match();

-- Function to update monthly leaderboards
CREATE OR REPLACE FUNCTION update_monthly_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month INTEGER := EXTRACT(MONTH FROM now());
  current_year INTEGER := EXTRACT(YEAR FROM now());
BEGIN
  -- Clear existing month data
  DELETE FROM public.leaderboards 
  WHERE month = current_month AND year = current_year;

  -- Insert current month leaderboard data
  INSERT INTO public.leaderboards (
    player_id, month, year, city, district, rank_category,
    total_wins, total_matches, win_rate, ranking_points, position
  )
  SELECT 
    ps.player_id,
    current_month,
    current_year,
    p.city,
    p.district,
    p.verified_rank,
    ps.matches_won,
    ps.matches_played,
    ps.win_rate,
    ps.matches_won * 10 + ps.current_streak * 5 as ranking_points,
    ROW_NUMBER() OVER (
      PARTITION BY p.city, p.verified_rank 
      ORDER BY ps.matches_won DESC, ps.win_rate DESC
    ) as position
  FROM public.player_stats ps
  JOIN public.profiles p ON ps.player_id = p.user_id
  WHERE ps.matches_played > 0
  ORDER BY ranking_points DESC;
END;
$$;