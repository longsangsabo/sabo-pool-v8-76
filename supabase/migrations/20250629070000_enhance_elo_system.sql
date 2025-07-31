-- Enhance ELO System with Real Calculation
-- This migration adds comprehensive ELO calculation functions

-- Create ELO calculation function
CREATE OR REPLACE FUNCTION calculate_elo_rating(
  p1_rating INTEGER,
  p2_rating INTEGER,
  p1_matches INTEGER,
  p2_matches INTEGER,
  p1_streak INTEGER,
  p2_streak INTEGER,
  winner_id UUID,
  is_tournament BOOLEAN DEFAULT FALSE,
  is_quality_match BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  p1_new_rating INTEGER,
  p2_new_rating INTEGER,
  p1_rating_change INTEGER,
  p2_rating_change INTEGER,
  p1_expected_score NUMERIC,
  p2_expected_score NUMERIC,
  p1_k_factor INTEGER,
  p2_k_factor INTEGER,
  p1_bonus INTEGER,
  p2_bonus INTEGER
) AS $$
DECLARE
  k1 INTEGER;
  k2 INTEGER;
  expected1 NUMERIC;
  expected2 NUMERIC;
  actual1 INTEGER;
  actual2 INTEGER;
  rating_change1 INTEGER;
  rating_change2 INTEGER;
  bonus1 INTEGER := 0;
  bonus2 INTEGER := 0;
  new_rating1 INTEGER;
  new_rating2 INTEGER;
BEGIN
  -- Calculate K-factor for each player
  k1 := CASE 
    WHEN p1_matches < 30 THEN 40
    WHEN p1_matches < 100 THEN 30
    WHEN p1_matches < 200 THEN 25
    ELSE 20
  END;
  
  k2 := CASE 
    WHEN p2_matches < 30 THEN 40
    WHEN p2_matches < 100 THEN 30
    WHEN p2_matches < 200 THEN 25
    ELSE 20
  END;
  
  -- Calculate expected scores
  expected1 := 1.0 / (1.0 + POWER(10.0, (p2_rating - p1_rating) / 400.0));
  expected2 := 1.0 - expected1;
  
  -- Determine actual results
  actual1 := CASE WHEN winner_id IS NOT NULL THEN 1 ELSE 0 END;
  actual2 := CASE WHEN winner_id IS NOT NULL THEN 0 ELSE 1 END;
  
  -- Calculate basic rating changes
  rating_change1 := ROUND(k1 * (actual1 - expected1));
  rating_change2 := ROUND(k2 * (actual2 - expected2));
  
  -- Calculate bonus factors
  IF actual1 = 1 THEN
    -- Tournament bonus (+20%)
    IF is_tournament THEN
      bonus1 := bonus1 + ROUND(p1_rating * 0.2);
    END IF;
    
    -- Streak bonus (+5% per win, max 25%)
    IF p1_streak > 0 THEN
      bonus1 := bonus1 + ROUND(p1_rating * LEAST(p1_streak * 0.05, 0.25));
    END IF;
    
    -- Quality match bonus (+10%)
    IF is_quality_match THEN
      bonus1 := bonus1 + ROUND(p1_rating * 0.1);
    END IF;
    
    -- Upset bonus (beating higher rated player)
    IF p1_rating < p2_rating AND (p2_rating - p1_rating) > 200 THEN
      bonus1 := bonus1 + ROUND((p2_rating - p1_rating) * 0.1);
    END IF;
  END IF;
  
  IF actual2 = 1 THEN
    -- Tournament bonus (+20%)
    IF is_tournament THEN
      bonus2 := bonus2 + ROUND(p2_rating * 0.2);
    END IF;
    
    -- Streak bonus (+5% per win, max 25%)
    IF p2_streak > 0 THEN
      bonus2 := bonus2 + ROUND(p2_rating * LEAST(p2_streak * 0.05, 0.25));
    END IF;
    
    -- Quality match bonus (+10%)
    IF is_quality_match THEN
      bonus2 := bonus2 + ROUND(p2_rating * 0.1);
    END IF;
    
    -- Upset bonus (beating higher rated player)
    IF p2_rating < p1_rating AND (p1_rating - p2_rating) > 200 THEN
      bonus2 := bonus2 + ROUND((p1_rating - p2_rating) * 0.1);
    END IF;
  END IF;
  
  -- Calculate new ratings (minimum 100)
  new_rating1 := GREATEST(100, ROUND(p1_rating + rating_change1 + bonus1));
  new_rating2 := GREATEST(100, ROUND(p2_rating + rating_change2 + bonus2));
  
  RETURN QUERY SELECT 
    new_rating1,
    new_rating2,
    rating_change1 + bonus1,
    rating_change2 + bonus2,
    expected1,
    expected2,
    k1,
    k2,
    bonus1,
    bonus2;
END;
$$ LANGUAGE plpgsql;

-- Create function to update player ratings after match
CREATE OR REPLACE FUNCTION update_player_ratings_after_match(
  match_id UUID,
  p1_id UUID,
  p2_id UUID,
  p1_score INTEGER,
  p2_score INTEGER,
  winner_id UUID,
  is_tournament BOOLEAN DEFAULT FALSE,
  is_quality_match BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
DECLARE
  p1_profile RECORD;
  p2_profile RECORD;
  elo_result RECORD;
  p1_new_streak INTEGER;
  p2_new_streak INTEGER;
BEGIN
  -- Get player profiles
  SELECT 
    user_id,
    ranking_points,
    matches_played,
    current_streak,
    wins
  INTO p1_profile
  FROM profiles 
  WHERE user_id = p1_id;
  
  SELECT 
    user_id,
    ranking_points,
    matches_played,
    current_streak,
    wins
  INTO p2_profile
  FROM profiles 
  WHERE user_id = p2_id;
  
  -- Calculate ELO ratings
  SELECT * INTO elo_result
  FROM calculate_elo_rating(
    p1_profile.ranking_points,
    p2_profile.ranking_points,
    p1_profile.matches_played,
    p2_profile.matches_played,
    p1_profile.current_streak,
    p2_profile.current_streak,
    winner_id,
    is_tournament,
    is_quality_match
  );
  
  -- Update streaks
  p1_new_streak := CASE WHEN winner_id = p1_id THEN p1_profile.current_streak + 1 ELSE 0 END;
  p2_new_streak := CASE WHEN winner_id = p2_id THEN p2_profile.current_streak + 1 ELSE 0 END;
  
  -- Update player 1
  UPDATE profiles SET
    ranking_points = elo_result.p1_new_rating,
    matches_played = matches_played + 1,
    wins = CASE WHEN winner_id = p1_id THEN wins + 1 ELSE wins END,
    current_streak = p1_new_streak,
    current_rank = CASE 
      WHEN elo_result.p1_new_rating >= 2500 THEN 'G+'
      WHEN elo_result.p1_new_rating >= 2000 THEN 'G'
      WHEN elo_result.p1_new_rating >= 1500 THEN 'A+'
      WHEN elo_result.p1_new_rating >= 1000 THEN 'A'
      WHEN elo_result.p1_new_rating >= 500 THEN 'B+'
      ELSE 'B'
    END,
    updated_at = NOW()
  WHERE user_id = p1_id;
  
  -- Update player 2
  UPDATE profiles SET
    ranking_points = elo_result.p2_new_rating,
    matches_played = matches_played + 1,
    wins = CASE WHEN winner_id = p2_id THEN wins + 1 ELSE wins END,
    current_streak = p2_new_streak,
    current_rank = CASE 
      WHEN elo_result.p2_new_rating >= 2500 THEN 'G+'
      WHEN elo_result.p2_new_rating >= 2000 THEN 'G'
      WHEN elo_result.p2_new_rating >= 1500 THEN 'A+'
      WHEN elo_result.p2_new_rating >= 1000 THEN 'A'
      WHEN elo_result.p2_new_rating >= 500 THEN 'B+'
      ELSE 'B'
    END,
    updated_at = NOW()
  WHERE user_id = p2_id;
  
  -- Update match with ELO details
  UPDATE matches SET
    score_player1 = p1_score,
    score_player2 = p2_score,
    winner_id = winner_id,
    status = 'completed',
    p1_rating_change = elo_result.p1_rating_change,
    p2_rating_change = elo_result.p2_rating_change,
    p1_expected_score = elo_result.p1_expected_score,
    p2_expected_score = elo_result.p2_expected_score,
    p1_k_factor = elo_result.p1_k_factor,
    p2_k_factor = elo_result.p2_k_factor,
    p1_bonus = elo_result.p1_bonus,
    p2_bonus = elo_result.p2_bonus,
    updated_at = NOW()
  WHERE id = match_id;
  
  -- Log rating changes
  INSERT INTO rating_history (
    user_id,
    match_id,
    old_rating,
    new_rating,
    rating_change,
    k_factor,
    bonus,
    expected_score,
    actual_score,
    created_at
  ) VALUES 
  (p1_id, match_id, p1_profile.ranking_points, elo_result.p1_new_rating, 
   elo_result.p1_rating_change, elo_result.p1_k_factor, elo_result.p1_bonus, 
   elo_result.p1_expected_score, CASE WHEN winner_id = p1_id THEN 1 ELSE 0 END, NOW()),
  (p2_id, match_id, p2_profile.ranking_points, elo_result.p2_new_rating, 
   elo_result.p2_rating_change, elo_result.p2_k_factor, elo_result.p2_bonus, 
   elo_result.p2_expected_score, CASE WHEN winner_id = p2_id THEN 1 ELSE 0 END, NOW());
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create rating_history table to track rating changes
CREATE TABLE IF NOT EXISTS rating_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  old_rating INTEGER NOT NULL,
  new_rating INTEGER NOT NULL,
  rating_change INTEGER NOT NULL,
  k_factor INTEGER NOT NULL,
  bonus INTEGER DEFAULT 0,
  expected_score NUMERIC NOT NULL,
  actual_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rating_history_user_id ON rating_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rating_history_match_id ON rating_history(match_id);
CREATE INDEX IF NOT EXISTS idx_rating_history_created_at ON rating_history(created_at);

-- Add columns to matches table for ELO tracking
ALTER TABLE matches ADD COLUMN IF NOT EXISTS p1_rating_change INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS p2_rating_change INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS p1_expected_score NUMERIC;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS p2_expected_score NUMERIC;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS p1_k_factor INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS p2_k_factor INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS p1_bonus INTEGER DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS p2_bonus INTEGER DEFAULT 0;

-- Create function to get player ELO statistics
CREATE OR REPLACE FUNCTION get_player_elo_stats(user_uuid UUID)
RETURNS TABLE (
  current_rating INTEGER,
  highest_rating INTEGER,
  lowest_rating INTEGER,
  total_matches INTEGER,
  wins INTEGER,
  losses INTEGER,
  win_rate NUMERIC,
  current_streak INTEGER,
  longest_streak INTEGER,
  average_rating_change NUMERIC,
  volatility NUMERIC,
  performance_rating INTEGER
) AS $$
DECLARE
  player_profile RECORD;
  rating_stats RECORD;
  streak_stats RECORD;
BEGIN
  -- Get basic profile
  SELECT 
    ranking_points,
    matches_played,
    wins,
    current_streak
  INTO player_profile
  FROM profiles 
  WHERE user_id = user_uuid;
  
  -- Get rating statistics
  SELECT 
    MAX(new_rating) as highest_rating,
    MIN(new_rating) as lowest_rating,
    AVG(rating_change) as avg_change,
    STDDEV(new_rating) as volatility
  INTO rating_stats
  FROM rating_history 
  WHERE user_id = user_uuid;
  
  -- Get streak statistics
  SELECT MAX(streak_length) as longest_streak
  INTO streak_stats
  FROM (
    SELECT 
      COUNT(*) as streak_length
    FROM rating_history 
    WHERE user_id = user_uuid 
    AND actual_score = 1
    GROUP BY DATE_TRUNC('day', created_at)
  ) streaks;
  
  RETURN QUERY SELECT
    player_profile.ranking_points,
    COALESCE(rating_stats.highest_rating, player_profile.ranking_points),
    COALESCE(rating_stats.lowest_rating, player_profile.ranking_points),
    player_profile.matches_played,
    player_profile.wins,
    player_profile.matches_played - player_profile.wins,
    CASE WHEN player_profile.matches_played > 0 
         THEN ROUND((player_profile.wins::NUMERIC / player_profile.matches_played) * 100, 2)
         ELSE 0 END,
    player_profile.current_streak,
    COALESCE(streak_stats.longest_streak, 0),
    COALESCE(rating_stats.avg_change, 0),
    COALESCE(rating_stats.volatility, 0),
    CASE WHEN player_profile.matches_played > 0 
         THEN ROUND(player_profile.ranking_points + (rating_stats.avg_change * player_profile.matches_played))
         ELSE player_profile.ranking_points END;
END;
$$ LANGUAGE plpgsql;

-- Create function to predict match outcome
CREATE OR REPLACE FUNCTION predict_match_outcome(
  p1_rating INTEGER,
  p2_rating INTEGER
)
RETURNS TABLE (
  p1_win_probability NUMERIC,
  p2_win_probability NUMERIC,
  expected_score TEXT,
  rating_difference INTEGER,
  is_upset_possible BOOLEAN
) AS $$
DECLARE
  expected1 NUMERIC;
  expected2 NUMERIC;
  rating_diff INTEGER;
BEGIN
  rating_diff := p2_rating - p1_rating;
  expected1 := 1.0 / (1.0 + POWER(10.0, rating_diff / 400.0));
  expected2 := 1.0 - expected1;
  
  RETURN QUERY SELECT
    ROUND(expected1 * 100, 2),
    ROUND(expected2 * 100, 2),
    ROUND(expected1 * 10) || '-' || ROUND(expected2 * 10),
    ABS(rating_diff),
    ABS(rating_diff) > 200;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for rating_history
ALTER TABLE rating_history ENABLE ROW LEVEL SECURITY;

-- Create policies for rating_history
CREATE POLICY "Users can view own rating history" ON rating_history
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert rating history" ON rating_history
FOR INSERT WITH CHECK (true);

-- Create trigger to automatically update ratings when match is completed
CREATE OR REPLACE FUNCTION trigger_update_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update when match status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM update_player_ratings_after_match(
      NEW.id,
      NEW.player1_id,
      NEW.player2_id,
      NEW.score_player1,
      NEW.score_player2,
      NEW.winner_id,
      FALSE, -- is_tournament (can be enhanced later)
      FALSE  -- is_quality_match (can be enhanced later)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_ratings_trigger ON matches;
CREATE TRIGGER update_ratings_trigger
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_ratings();

-- Verify the functions work
SELECT 'ELO System Enhanced Successfully' as status; 