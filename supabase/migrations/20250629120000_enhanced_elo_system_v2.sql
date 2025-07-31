-- Enhanced ELO System v2.0 for SABO POOL ARENA
-- Comprehensive optimization with advanced algorithms

-- Enhanced ELO calculation function with multiple factors
CREATE OR REPLACE FUNCTION calculate_enhanced_elo_rating(
  p1_rating INTEGER,
  p2_rating INTEGER,
  p1_matches INTEGER,
  p2_matches INTEGER,
  p1_streak INTEGER,
  p2_streak INTEGER,
  p1_volatility INTEGER DEFAULT 0,
  p2_volatility INTEGER DEFAULT 0,
  p1_recent_form INTEGER DEFAULT 0,
  p2_recent_form INTEGER DEFAULT 0,
  p1_consistency INTEGER DEFAULT 50,
  p2_consistency INTEGER DEFAULT 50,
  winner_id UUID,
  match_type VARCHAR(20) DEFAULT 'regular',
  tournament_tier VARCHAR(20) DEFAULT NULL,
  challenge_bet INTEGER DEFAULT 0,
  quality_score INTEGER DEFAULT 5,
  upset_factor INTEGER DEFAULT 0,
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
  p2_bonus INTEGER,
  p1_volatility_change INTEGER,
  p2_volatility_change INTEGER,
  confidence_interval NUMERIC,
  match_quality_score INTEGER
) AS $$
DECLARE
  k1 INTEGER;
  k2 INTEGER;
  expected1 NUMERIC;
  expected2 NUMERIC;
  actual1 INTEGER;
  actual2 INTEGER;
  base_change1 INTEGER;
  base_change2 INTEGER;
  bonus1 INTEGER := 0;
  bonus2 INTEGER := 0;
  volatility1 INTEGER := 0;
  volatility2 INTEGER := 0;
  new_rating1 INTEGER;
  new_rating2 INTEGER;
  adjusted_rating1 INTEGER;
  adjusted_rating2 INTEGER;
  confidence NUMERIC;
  match_quality INTEGER;
BEGIN
  -- 1. Calculate dynamic K-factors
  k1 := calculate_dynamic_k_factor(p1_matches, p1_streak, p1_volatility, match_type, tournament_tier, challenge_bet, is_tournament);
  k2 := calculate_dynamic_k_factor(p2_matches, p2_streak, p2_volatility, match_type, tournament_tier, challenge_bet, is_tournament);
  
  -- 2. Adjust ratings for recent form
  adjusted_rating1 := p1_rating + ROUND((p1_recent_form / 100.0) * 50);
  adjusted_rating2 := p2_rating + ROUND((p2_recent_form / 100.0) * 50);
  
  -- 3. Calculate expected scores
  expected1 := 1.0 / (1.0 + POWER(10.0, (adjusted_rating2 - adjusted_rating1) / 400.0));
  expected2 := 1.0 - expected1;
  
  -- 4. Determine actual results
  actual1 := CASE WHEN winner_id IS NOT NULL THEN 1 ELSE 0 END;
  actual2 := CASE WHEN winner_id IS NOT NULL THEN 0 ELSE 1 END;
  
  -- 5. Calculate base rating changes
  base_change1 := ROUND(k1 * (actual1 - expected1));
  base_change2 := ROUND(k2 * (actual2 - expected2));
  
  -- 6. Calculate advanced bonus factors
  bonus1 := calculate_advanced_bonus(p1_rating, p2_rating, p1_streak, p1_consistency, p1_recent_form, 
                                   match_type, tournament_tier, challenge_bet, quality_score, upset_factor, 
                                   is_tournament, is_quality_match, actual1);
  bonus2 := calculate_advanced_bonus(p2_rating, p1_rating, p2_streak, p2_consistency, p2_recent_form,
                                   match_type, tournament_tier, challenge_bet, quality_score, upset_factor,
                                   is_tournament, is_quality_match, actual2);
  
  -- 7. Calculate volatility adjustments
  volatility1 := ROUND(base_change1 * (LEAST(1.5, p1_volatility / 100.0) - 1));
  volatility2 := ROUND(base_change2 * (LEAST(1.5, p2_volatility / 100.0) - 1));
  
  -- 8. Calculate final ratings with bounds (100-3000)
  new_rating1 := GREATEST(100, LEAST(3000, ROUND(p1_rating + base_change1 + bonus1 + volatility1)));
  new_rating2 := GREATEST(100, LEAST(3000, ROUND(p2_rating + base_change2 + bonus2 + volatility2)));
  
  -- 9. Calculate match quality score
  match_quality := calculate_match_quality_score(p1_rating, p2_rating, upset_factor, is_tournament, match_type, quality_score);
  
  -- 10. Calculate confidence interval
  confidence := calculate_confidence_interval(p1_matches, p2_matches, is_tournament, match_type);
  
  RETURN QUERY SELECT 
    new_rating1,
    new_rating2,
    base_change1 + bonus1 + volatility1,
    base_change2 + bonus2 + volatility2,
    expected1,
    expected2,
    k1,
    k2,
    bonus1,
    bonus2,
    volatility1,
    volatility2,
    confidence,
    match_quality;
END;
$$ LANGUAGE plpgsql;

-- Dynamic K-factor calculation function
CREATE OR REPLACE FUNCTION calculate_dynamic_k_factor(
  matches_played INTEGER,
  current_streak INTEGER,
  volatility INTEGER,
  match_type VARCHAR(20),
  tournament_tier VARCHAR(20),
  challenge_bet INTEGER,
  is_tournament BOOLEAN
) RETURNS INTEGER AS $$
DECLARE
  k_factor INTEGER;
BEGIN
  -- Base K-factor based on experience
  IF matches_played < 30 THEN
    k_factor := 40; -- New players - rapid changes
  ELSIF matches_played < 100 THEN
    k_factor := 32; -- Intermediate players
  ELSIF matches_played < 200 THEN
    k_factor := 28; -- Experienced players
  ELSIF matches_played < 500 THEN
    k_factor := 24; -- Veteran players
  ELSE
    k_factor := 20; -- Elite players - stable
  END IF;
  
  -- Tournament multiplier
  IF is_tournament THEN
    CASE tournament_tier
      WHEN 'international' THEN k_factor := ROUND(k_factor * 2.0);
      WHEN 'national' THEN k_factor := ROUND(k_factor * 1.5);
      WHEN 'regional' THEN k_factor := ROUND(k_factor * 1.3);
      WHEN 'local' THEN k_factor := ROUND(k_factor * 1.1);
      ELSE k_factor := ROUND(k_factor * 1.2);
    END CASE;
  END IF;
  
  -- Challenge multiplier based on bet amount
  IF match_type = 'challenge' AND challenge_bet > 0 THEN
    k_factor := ROUND(k_factor * LEAST(1.5, 1.0 + (challenge_bet / 1000.0)));
  END IF;
  
  -- Streak multiplier
  IF current_streak > 3 THEN
    k_factor := ROUND(k_factor * LEAST(1.2, 1.0 + (current_streak * 0.1)));
  END IF;
  
  -- Volatility adjustment
  IF volatility > 100 THEN
    k_factor := ROUND(k_factor * 1.2); -- Increase K for volatile players
  END IF;
  
  -- Bounds: 16-60
  RETURN GREATEST(16, LEAST(60, k_factor));
END;
$$ LANGUAGE plpgsql;

-- Advanced bonus calculation function
CREATE OR REPLACE FUNCTION calculate_advanced_bonus(
  player_rating INTEGER,
  opponent_rating INTEGER,
  current_streak INTEGER,
  consistency_score INTEGER,
  recent_form INTEGER,
  match_type VARCHAR(20),
  tournament_tier VARCHAR(20),
  challenge_bet INTEGER,
  quality_score INTEGER,
  upset_factor INTEGER,
  is_tournament BOOLEAN,
  is_quality_match BOOLEAN,
  actual_result INTEGER
) RETURNS INTEGER AS $$
DECLARE
  bonus INTEGER := 0;
  tier_multiplier NUMERIC;
BEGIN
  IF actual_result != 1 THEN
    RETURN 0; -- Only bonus for winners
  END IF;
  
  -- Tournament bonus (scaled by tier)
  IF is_tournament THEN
    CASE tournament_tier
      WHEN 'international' THEN tier_multiplier := 2.0;
      WHEN 'national' THEN tier_multiplier := 1.5;
      WHEN 'regional' THEN tier_multiplier := 1.3;
      WHEN 'local' THEN tier_multiplier := 1.1;
      ELSE tier_multiplier := 1.2;
    END CASE;
    bonus := bonus + ROUND(player_rating * 0.2 * tier_multiplier);
  END IF;
  
  -- Streak bonus (diminishing returns)
  IF current_streak > 0 THEN
    bonus := bonus + ROUND(player_rating * LEAST(current_streak * 0.03, 0.15));
  END IF;
  
  -- Quality match bonus
  IF is_quality_match AND quality_score > 0 THEN
    bonus := bonus + ROUND(player_rating * 0.15 * (quality_score / 10.0));
  END IF;
  
  -- Upset bonus (beating higher rated player)
  IF player_rating < opponent_rating THEN
    DECLARE
      rating_diff INTEGER := opponent_rating - player_rating;
    BEGIN
      IF rating_diff > 100 THEN
        bonus := bonus + ROUND(rating_diff * LEAST(0.2, rating_diff / 1000.0) * 1.3);
      END IF;
    END;
  END IF;
  
  -- Consistency bonus
  IF consistency_score > 80 THEN
    bonus := bonus + ROUND(player_rating * 0.1);
  END IF;
  
  -- Form bonus
  IF recent_form > 50 THEN
    bonus := bonus + ROUND(player_rating * 0.05);
  END IF;
  
  -- Challenge bonus based on bet amount
  IF match_type = 'challenge' AND challenge_bet > 0 THEN
    bonus := bonus + ROUND(player_rating * LEAST(0.3, challenge_bet / 2000.0));
  END IF;
  
  RETURN bonus;
END;
$$ LANGUAGE plpgsql;

-- Match quality score calculation
CREATE OR REPLACE FUNCTION calculate_match_quality_score(
  p1_rating INTEGER,
  p2_rating INTEGER,
  upset_factor INTEGER,
  is_tournament BOOLEAN,
  match_type VARCHAR(20),
  quality_score INTEGER
) RETURNS INTEGER AS $$
DECLARE
  quality INTEGER := 5; -- Base quality
  rating_diff INTEGER;
BEGIN
  -- Rating difference factor
  rating_diff := ABS(p1_rating - p2_rating);
  IF rating_diff < 100 THEN
    quality := quality + 2; -- Close match
  ELSIF rating_diff < 300 THEN
    quality := quality + 1; -- Moderate difference
  END IF;
  
  -- Upset factor
  IF upset_factor > 0 THEN
    quality := quality + upset_factor;
  END IF;
  
  -- Tournament factor
  IF is_tournament THEN
    quality := quality + 1;
  END IF;
  
  -- Challenge factor
  IF match_type = 'challenge' THEN
    quality := quality + 1;
  END IF;
  
  -- Quality score adjustment
  IF quality_score > 0 THEN
    quality := quality + (quality_score - 5);
  END IF;
  
  RETURN GREATEST(1, LEAST(10, quality));
END;
$$ LANGUAGE plpgsql;

-- Confidence interval calculation
CREATE OR REPLACE FUNCTION calculate_confidence_interval(
  p1_matches INTEGER,
  p2_matches INTEGER,
  is_tournament BOOLEAN,
  match_type VARCHAR(20)
) RETURNS NUMERIC AS $$
DECLARE
  confidence NUMERIC := 0.8; -- Base confidence
  total_matches INTEGER;
BEGIN
  total_matches := p1_matches + p2_matches;
  
  -- More matches = higher confidence
  IF total_matches > 200 THEN
    confidence := confidence + 0.1;
  ELSIF total_matches < 50 THEN
    confidence := confidence - 0.2;
  END IF;
  
  -- Tournament matches have higher confidence
  IF is_tournament THEN
    confidence := confidence + 0.1;
  END IF;
  
  -- Challenge matches have higher confidence
  IF match_type = 'challenge' THEN
    confidence := confidence + 0.05;
  END IF;
  
  RETURN GREATEST(0.5, LEAST(0.95, confidence));
END;
$$ LANGUAGE plpgsql;

-- Enhanced rank calculation with sub-ranks
CREATE OR REPLACE FUNCTION get_enhanced_rank_from_rating(rating INTEGER) RETURNS VARCHAR(10) AS $$
BEGIN
  IF rating >= 2800 THEN RETURN 'S+'; -- Legendary
  ELSIF rating >= 2600 THEN RETURN 'S';  -- Master
  ELSIF rating >= 2400 THEN RETURN 'G+'; -- Elite
  ELSIF rating >= 2200 THEN RETURN 'G';  -- Expert
  ELSIF rating >= 2000 THEN RETURN 'A+'; -- Advanced
  ELSIF rating >= 1800 THEN RETURN 'A';  -- Intermediate+
  ELSIF rating >= 1600 THEN RETURN 'B+'; -- Intermediate
  ELSIF rating >= 1400 THEN RETURN 'B';  -- Beginner+
  ELSIF rating >= 1200 THEN RETURN 'C+'; -- Beginner
  ELSIF rating >= 1000 THEN RETURN 'C';  -- Novice+
  ELSIF rating >= 800 THEN RETURN 'D+';  -- Novice
  ELSIF rating >= 600 THEN RETURN 'D';   -- Rookie+
  ELSIF rating >= 400 THEN RETURN 'E+';  -- Rookie
  ELSE RETURN 'E'; -- Newcomer
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enhanced rating from rank
CREATE OR REPLACE FUNCTION get_enhanced_rating_from_rank(rank VARCHAR(10)) RETURNS INTEGER AS $$
BEGIN
  CASE rank
    WHEN 'S+' THEN RETURN 2800;
    WHEN 'S' THEN RETURN 2600;
    WHEN 'G+' THEN RETURN 2400;
    WHEN 'G' THEN RETURN 2200;
    WHEN 'A+' THEN RETURN 2000;
    WHEN 'A' THEN RETURN 1800;
    WHEN 'B+' THEN RETURN 1600;
    WHEN 'B' THEN RETURN 1400;
    WHEN 'C+' THEN RETURN 1200;
    WHEN 'C' THEN RETURN 1000;
    WHEN 'D+' THEN RETURN 800;
    WHEN 'D' THEN RETURN 600;
    WHEN 'E+' THEN RETURN 400;
    WHEN 'E' THEN RETURN 200;
    ELSE RETURN 1000;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Enhanced match prediction function
CREATE OR REPLACE FUNCTION predict_enhanced_match_result(
  p1_rating INTEGER,
  p2_rating INTEGER,
  p1_matches INTEGER DEFAULT 0,
  p2_matches INTEGER DEFAULT 0,
  p1_recent_form INTEGER DEFAULT 0,
  p2_recent_form INTEGER DEFAULT 0
) RETURNS TABLE (
  p1_win_probability INTEGER,
  p2_win_probability INTEGER,
  expected_score VARCHAR(10),
  confidence INTEGER,
  upset_potential INTEGER,
  recommended_bet INTEGER
) AS $$
DECLARE
  adjusted_rating1 INTEGER;
  adjusted_rating2 INTEGER;
  p1_expected NUMERIC;
  p2_expected NUMERIC;
  total_matches INTEGER;
  confidence NUMERIC;
  rating_diff INTEGER;
  upset_potential NUMERIC;
  base_bet INTEGER;
  win_rate_adjustment NUMERIC;
BEGIN
  -- Adjust ratings for form
  adjusted_rating1 := p1_rating + ROUND((p1_recent_form / 100.0) * 50);
  adjusted_rating2 := p2_rating + ROUND((p2_recent_form / 100.0) * 50);
  
  -- Calculate expected probabilities
  p1_expected := 1.0 / (1.0 + POWER(10.0, (adjusted_rating2 - adjusted_rating1) / 400.0));
  p2_expected := 1.0 - p1_expected;
  
  -- Calculate confidence based on experience
  total_matches := p1_matches + p2_matches;
  confidence := GREATEST(0.5, LEAST(0.95, 0.7 + (total_matches / 1000.0)));
  
  -- Calculate upset potential
  rating_diff := ABS(adjusted_rating1 - adjusted_rating2);
  upset_potential := GREATEST(0, (rating_diff - 200) / 100.0);
  
  -- Calculate recommended bet
  base_bet := GREATEST(100, LEAST(1000, rating_diff * 2));
  IF p1_expected > 0.6 THEN
    win_rate_adjustment := 1.2;
  ELSIF p1_expected < 0.4 THEN
    win_rate_adjustment := 0.8;
  ELSE
    win_rate_adjustment := 1.0;
  END IF;
  
  RETURN QUERY SELECT 
    ROUND(p1_expected * 100),
    ROUND(p2_expected * 100),
    ROUND(p1_expected * 10) || '-' || ROUND(p2_expected * 10),
    ROUND(confidence * 100),
    ROUND(upset_potential * 100),
    ROUND(base_bet * win_rate_adjustment);
END;
$$ LANGUAGE plpgsql;

-- Enhanced player stats update function
CREATE OR REPLACE FUNCTION update_enhanced_player_stats_after_match(
  match_id UUID,
  p1_id UUID,
  p2_id UUID,
  p1_score INTEGER,
  p2_score INTEGER,
  winner_id UUID,
  match_type VARCHAR(20) DEFAULT 'regular',
  tournament_tier VARCHAR(20) DEFAULT NULL,
  challenge_bet INTEGER DEFAULT 0,
  quality_score INTEGER DEFAULT 5,
  upset_factor INTEGER DEFAULT 0,
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
  p1_new_rating INTEGER;
  p2_new_rating INTEGER;
  p1_rating_change INTEGER;
  p2_rating_change INTEGER;
BEGIN
  -- Get player profiles with enhanced stats
  SELECT 
    user_id,
    ranking_points,
    matches_played,
    current_streak,
    wins,
    rating_volatility,
    recent_form,
    consistency_score,
    highest_rating,
    lowest_rating
  INTO p1_profile
  FROM profiles 
  WHERE user_id = p1_id;
  
  SELECT 
    user_id,
    ranking_points,
    matches_played,
    current_streak,
    wins,
    rating_volatility,
    recent_form,
    consistency_score,
    highest_rating,
    lowest_rating
  INTO p2_profile
  FROM profiles 
  WHERE user_id = p2_id;
  
  -- Calculate enhanced ELO ratings
  SELECT * INTO elo_result
  FROM calculate_enhanced_elo_rating(
    p1_profile.ranking_points,
    p2_profile.ranking_points,
    p1_profile.matches_played,
    p2_profile.matches_played,
    p1_profile.current_streak,
    p2_profile.current_streak,
    p1_profile.rating_volatility,
    p2_profile.rating_volatility,
    p1_profile.recent_form,
    p2_profile.recent_form,
    p1_profile.consistency_score,
    p2_profile.consistency_score,
    winner_id,
    match_type,
    tournament_tier,
    challenge_bet,
    quality_score,
    upset_factor,
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
    current_rank = get_enhanced_rank_from_rating(elo_result.p1_new_rating),
    highest_rating = GREATEST(highest_rating, elo_result.p1_new_rating),
    lowest_rating = LEAST(lowest_rating, elo_result.p1_new_rating),
    updated_at = NOW()
  WHERE user_id = p1_id;
  
  -- Update player 2
  UPDATE profiles SET
    ranking_points = elo_result.p2_new_rating,
    matches_played = matches_played + 1,
    wins = CASE WHEN winner_id = p2_id THEN wins + 1 ELSE wins END,
    current_streak = p2_new_streak,
    current_rank = get_enhanced_rank_from_rating(elo_result.p2_new_rating),
    highest_rating = GREATEST(highest_rating, elo_result.p2_new_rating),
    lowest_rating = LEAST(lowest_rating, elo_result.p2_new_rating),
    updated_at = NOW()
  WHERE user_id = p2_id;
  
  -- Update match with enhanced ELO details
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
    match_quality_score = elo_result.match_quality_score,
    confidence_interval = elo_result.confidence_interval,
    updated_at = NOW()
  WHERE id = match_id;
  
  -- Log enhanced rating changes
  INSERT INTO rating_history (
    user_id,
    match_id,
    old_rating,
    new_rating,
    rating_change,
    k_factor,
    bonus,
    volatility_change,
    expected_score,
    actual_score,
    match_quality_score,
    confidence_interval,
    created_at
  ) VALUES 
  (p1_id, match_id, p1_profile.ranking_points, elo_result.p1_new_rating, 
   elo_result.p1_rating_change, elo_result.p1_k_factor, elo_result.p1_bonus,
   elo_result.p1_volatility_change, elo_result.p1_expected_score, 
   CASE WHEN winner_id = p1_id THEN 1 ELSE 0 END, elo_result.match_quality_score,
   elo_result.confidence_interval, NOW()),
  (p2_id, match_id, p2_profile.ranking_points, elo_result.p2_new_rating, 
   elo_result.p2_rating_change, elo_result.p2_k_factor, elo_result.p2_bonus,
   elo_result.p2_volatility_change, elo_result.p2_expected_score, 
   CASE WHEN winner_id = p2_id THEN 1 ELSE 0 END, elo_result.match_quality_score,
   elo_result.confidence_interval, NOW());
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add new columns to profiles table for enhanced stats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating_volatility INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recent_form INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consistency_score INTEGER DEFAULT 50;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS highest_rating INTEGER DEFAULT 1000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lowest_rating INTEGER DEFAULT 1000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS elo_efficiency NUMERIC DEFAULT 0;

-- Add new columns to matches table for enhanced tracking
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_quality_score INTEGER DEFAULT 5;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS confidence_interval NUMERIC DEFAULT 0.8;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS p1_volatility_change INTEGER DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS p2_volatility_change INTEGER DEFAULT 0;

-- Add new columns to rating_history table
ALTER TABLE rating_history ADD COLUMN IF NOT EXISTS volatility_change INTEGER DEFAULT 0;
ALTER TABLE rating_history ADD COLUMN IF NOT EXISTS match_quality_score INTEGER DEFAULT 5;
ALTER TABLE rating_history ADD COLUMN IF NOT EXISTS confidence_interval NUMERIC DEFAULT 0.8;

-- Create function to calculate player statistics
CREATE OR REPLACE FUNCTION calculate_player_elo_statistics(user_uuid UUID)
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
  performance_rating INTEGER,
  recent_form INTEGER,
  consistency_score INTEGER,
  elo_efficiency NUMERIC,
  rank_progression JSONB
) AS $$
DECLARE
  player_profile RECORD;
  rating_stats RECORD;
  streak_stats RECORD;
  recent_matches RECORD[];
  rating_history_array INTEGER[];
  current_rank VARCHAR(10);
  next_rank VARCHAR(10);
  points_to_next INTEGER;
  estimated_matches INTEGER;
BEGIN
  -- Get player profile
  SELECT * INTO player_profile FROM profiles WHERE user_id = user_uuid;
  
  IF player_profile IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate rating statistics
  SELECT 
    AVG(rating_change) as avg_change,
    STDDEV(rating_change) as volatility
  INTO rating_stats
  FROM rating_history 
  WHERE user_id = user_uuid;
  
  -- Calculate streak statistics
  SELECT 
    MAX(streak_length) as longest_streak
  INTO streak_stats
  FROM (
    SELECT 
      COUNT(*) as streak_length
    FROM rating_history 
    WHERE user_id = user_uuid 
    AND actual_score = 1
    GROUP BY DATE_TRUNC('day', created_at)
  ) streaks;
  
  -- Get recent matches for form calculation
  SELECT ARRAY_AGG(rating_change ORDER BY created_at DESC) INTO rating_history_array
  FROM rating_history 
  WHERE user_id = user_uuid 
  ORDER BY created_at DESC 
  LIMIT 10;
  
  -- Calculate recent form
  DECLARE
    form INTEGER := 0;
    recent_count INTEGER := 0;
  BEGIN
    IF rating_history_array IS NOT NULL THEN
      recent_count := ARRAY_LENGTH(rating_history_array, 1);
      FOR i IN 1..recent_count LOOP
        IF rating_history_array[i] > 0 THEN
          form := form + 10 + GREATEST(0, rating_history_array[i] / 10);
        ELSE
          form := form - 10 + GREATEST(0, -rating_history_array[i] / 10);
        END IF;
      END LOOP;
      form := GREATEST(-100, LEAST(100, form / recent_count));
    END IF;
  END;
  
  -- Calculate consistency score
  DECLARE
    consistency INTEGER := 50;
  BEGIN
    IF rating_stats.volatility IS NOT NULL THEN
      consistency := GREATEST(0, 100 - (rating_stats.volatility / 2));
    END IF;
  END;
  
  -- Calculate ELO efficiency
  DECLARE
    efficiency NUMERIC := 0;
  BEGIN
    IF player_profile.matches_played > 0 THEN
      efficiency := (player_profile.ranking_points - 1000) / player_profile.matches_played;
    END IF;
  END;
  
  -- Calculate rank progression
  current_rank := get_enhanced_rank_from_rating(player_profile.ranking_points);
  next_rank := get_enhanced_rank_from_rating(player_profile.ranking_points + 200);
  points_to_next := (get_enhanced_rating_from_rank(current_rank) + 200) - player_profile.ranking_points;
  estimated_matches := CEIL(points_to_next / 15.0);
  
  RETURN QUERY SELECT 
    player_profile.ranking_points,
    player_profile.highest_rating,
    player_profile.lowest_rating,
    player_profile.matches_played,
    player_profile.wins,
    player_profile.matches_played - player_profile.wins,
    CASE WHEN player_profile.matches_played > 0 
         THEN (player_profile.wins::NUMERIC / player_profile.matches_played) * 100 
         ELSE 0 END,
    player_profile.current_streak,
    COALESCE(streak_stats.longest_streak, 0),
    COALESCE(rating_stats.avg_change, 0),
    COALESCE(rating_stats.volatility, 0),
    ROUND(player_profile.ranking_points + (COALESCE(rating_stats.avg_change, 0) * 10)),
    form,
    consistency,
    efficiency,
    jsonb_build_object(
      'current_rank', current_rank,
      'next_rank', next_rank,
      'points_to_next', points_to_next,
      'estimated_matches', estimated_matches
    );
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_rating_volatility ON profiles(rating_volatility);
CREATE INDEX IF NOT EXISTS idx_profiles_recent_form ON profiles(recent_form);
CREATE INDEX IF NOT EXISTS idx_profiles_consistency_score ON profiles(consistency_score);
CREATE INDEX IF NOT EXISTS idx_matches_quality_score ON matches(match_quality_score);
CREATE INDEX IF NOT EXISTS idx_rating_history_volatility ON rating_history(volatility_change);
CREATE INDEX IF NOT EXISTS idx_rating_history_quality ON rating_history(match_quality_score);

-- Create trigger to update enhanced stats after match completion
CREATE OR REPLACE FUNCTION trigger_update_enhanced_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update player statistics
    UPDATE profiles SET
      rating_volatility = (
        SELECT COALESCE(STDDEV(rating_change), 0)
        FROM rating_history 
        WHERE user_id = profiles.user_id
        ORDER BY created_at DESC 
        LIMIT 20
      ),
      recent_form = (
        SELECT COALESCE(AVG(
          CASE WHEN actual_score = 1 THEN 10 + GREATEST(0, rating_change / 10)
               ELSE -10 + GREATEST(0, -rating_change / 10)
          END
        ), 0)
        FROM rating_history 
        WHERE user_id = profiles.user_id
        ORDER BY created_at DESC 
        LIMIT 10
      ),
      consistency_score = (
        SELECT GREATEST(0, 100 - (COALESCE(STDDEV(rating_change), 0) / 2))
        FROM rating_history 
        WHERE user_id = profiles.user_id
        ORDER BY created_at DESC 
        LIMIT 20
      ),
      elo_efficiency = CASE WHEN matches_played > 0 
                           THEN (ranking_points - 1000) / matches_played 
                           ELSE 0 END
    WHERE user_id IN (NEW.player1_id, NEW.player2_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_enhanced_stats_trigger ON matches;
CREATE TRIGGER update_enhanced_stats_trigger
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_enhanced_stats(); 