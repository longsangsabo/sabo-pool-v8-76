-- Fix the process_challenge_completion function to use correct column names
CREATE OR REPLACE FUNCTION process_challenge_completion(
  p_challenge_id uuid,
  p_challenger_score integer,
  p_opponent_score integer,
  p_submitter_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge RECORD;
  v_winner_id uuid;
  v_loser_id uuid;
  v_points_to_award integer;
  v_result jsonb;
BEGIN
  -- Get challenge details
  SELECT * INTO v_challenge 
  FROM challenges 
  WHERE id = p_challenge_id AND status = 'accepted';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Challenge not found or not accepted');
  END IF;
  
  -- Verify submitter is part of challenge
  IF p_submitter_id NOT IN (v_challenge.challenger_id, v_challenge.opponent_id) THEN
    RETURN jsonb_build_object('error', 'Unauthorized to submit score');
  END IF;
  
  -- Determine winner
  IF p_challenger_score >= v_challenge.race_to AND p_challenger_score > p_opponent_score THEN
    v_winner_id := v_challenge.challenger_id;
    v_loser_id := v_challenge.opponent_id;
  ELSIF p_opponent_score >= v_challenge.race_to AND p_opponent_score > p_challenger_score THEN
    v_winner_id := v_challenge.opponent_id;
    v_loser_id := v_challenge.challenger_id;
  ELSE
    RETURN jsonb_build_object('error', 'Invalid score - no winner determined');
  END IF;
  
  -- Update challenge with scores and completion status
  UPDATE challenges SET
    challenger_final_score = p_challenger_score,
    opponent_final_score = p_opponent_score,
    status = 'completed',
    actual_end_time = NOW()
  WHERE id = p_challenge_id;
  
  -- Award SPA points to winner
  v_points_to_award := COALESCE(v_challenge.bet_points, 100);
  
  -- Insert SPA points log entry using correct column names
  INSERT INTO spa_points_log (user_id, points, category, description, reference_id, reference_type)
  VALUES (v_winner_id, v_points_to_award, 'challenge_victory', 'Thắng thách đấu', p_challenge_id, 'challenge');
  
  -- Update winner's SPA points
  UPDATE player_rankings 
  SET spa_points = spa_points + v_points_to_award,
      wins = wins + 1,
      total_matches = total_matches + 1,
      updated_at = NOW()
  WHERE user_id = v_winner_id;
  
  -- Update loser's stats
  UPDATE player_rankings 
  SET losses = losses + 1,
      total_matches = total_matches + 1,
      updated_at = NOW()
  WHERE user_id = v_loser_id;
  
  -- Update daily challenge stats for both players
  INSERT INTO daily_challenge_stats (user_id, challenge_date, challenge_count, spa_points_earned)
  VALUES 
    (v_winner_id, CURRENT_DATE, 1, v_points_to_award),
    (v_loser_id, CURRENT_DATE, 1, 0)
  ON CONFLICT (user_id, challenge_date) 
  DO UPDATE SET 
    challenge_count = daily_challenge_stats.challenge_count + 1,
    spa_points_earned = daily_challenge_stats.spa_points_earned + EXCLUDED.spa_points_earned;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', v_winner_id,
    'points_awarded', v_points_to_award,
    'challenger_score', p_challenger_score,
    'opponent_score', p_opponent_score
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;