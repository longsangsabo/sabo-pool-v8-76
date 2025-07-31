-- Create challenge management functions
CREATE OR REPLACE FUNCTION public.create_challenge(
  p_challenger_id UUID,
  p_opponent_id UUID,
  p_bet_points INTEGER DEFAULT 100,
  p_race_to INTEGER DEFAULT 5,
  p_message TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge_id UUID;
BEGIN
  -- Validate challenger has enough SPA points
  IF (SELECT COALESCE(spa_points, 0) FROM player_rankings WHERE user_id = p_challenger_id) < 100 THEN
    RAISE EXCEPTION 'Insufficient SPA points to create challenge';
  END IF;
  
  -- Create challenge
  INSERT INTO challenges (
    challenger_id,
    opponent_id,
    bet_points,
    race_to,
    message,
    status,
    expires_at
  ) VALUES (
    p_challenger_id,
    p_opponent_id,
    p_bet_points,
    p_race_to,
    p_message,
    'pending',
    NOW() + INTERVAL '7 days'
  ) RETURNING id INTO v_challenge_id;
  
  -- Create notification for opponent
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    metadata
  ) VALUES (
    p_opponent_id,
    'Thách đấu mới',
    'Bạn có một thách đấu mới với ' || p_bet_points || ' điểm',
    'challenge',
    jsonb_build_object('challenge_id', v_challenge_id)
  );
  
  RETURN v_challenge_id;
END;
$$;

-- Accept challenge function
CREATE OR REPLACE FUNCTION public.accept_challenge(
  p_challenge_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge RECORD;
BEGIN
  -- Get challenge details
  SELECT * INTO v_challenge FROM challenges WHERE id = p_challenge_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;
  
  -- Verify user is the opponent
  IF v_challenge.opponent_id != p_user_id THEN
    RAISE EXCEPTION 'Only the challenged player can accept';
  END IF;
  
  -- Check if challenge is still pending
  IF v_challenge.status != 'pending' THEN
    RAISE EXCEPTION 'Challenge is no longer pending';
  END IF;
  
  -- Check if challenge has expired
  IF v_challenge.expires_at < NOW() THEN
    RAISE EXCEPTION 'Challenge has expired';
  END IF;
  
  -- Update challenge status
  UPDATE challenges 
  SET status = 'accepted',
      responded_at = NOW()
  WHERE id = p_challenge_id;
  
  -- Notify challenger
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    metadata
  ) VALUES (
    v_challenge.challenger_id,
    'Thách đấu được chấp nhận',
    'Thách đấu của bạn đã được chấp nhận',
    'challenge',
    jsonb_build_object('challenge_id', p_challenge_id)
  );
  
  RETURN TRUE;
END;
$$;

-- Complete challenge function
CREATE OR REPLACE FUNCTION public.complete_challenge(
  p_challenge_id UUID,
  p_winner_id UUID,
  p_challenger_score INTEGER,
  p_opponent_score INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge RECORD;
  v_loser_id UUID;
  v_elo_change INTEGER := 50;
  v_spa_change INTEGER;
BEGIN
  -- Get challenge details
  SELECT * INTO v_challenge FROM challenges WHERE id = p_challenge_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;
  
  -- Verify challenge is accepted
  IF v_challenge.status != 'accepted' THEN
    RAISE EXCEPTION 'Challenge must be accepted first';
  END IF;
  
  -- Determine loser
  v_loser_id := CASE 
    WHEN p_winner_id = v_challenge.challenger_id THEN v_challenge.opponent_id
    ELSE v_challenge.challenger_id
  END;
  
  -- Calculate SPA points change (winner gets bet points, loser loses bet points)
  v_spa_change := v_challenge.bet_points;
  
  -- Update challenge with results
  UPDATE challenges 
  SET status = 'completed',
      completed_at = NOW()
  WHERE id = p_challenge_id;
  
  -- Update winner's stats
  UPDATE player_rankings 
  SET spa_points = spa_points + v_spa_change,
      elo_points = elo_points + v_elo_change,
      total_matches = total_matches + 1,
      wins = wins + 1,
      win_streak = win_streak + 1,
      updated_at = NOW()
  WHERE user_id = p_winner_id;
  
  -- Update loser's stats
  UPDATE player_rankings 
  SET spa_points = GREATEST(0, spa_points - v_spa_change),
      elo_points = GREATEST(800, elo_points - v_elo_change),
      total_matches = total_matches + 1,
      losses = losses + 1,
      win_streak = 0,
      updated_at = NOW()
  WHERE user_id = v_loser_id;
  
  -- Create match record
  INSERT INTO matches (
    player1_id,
    player2_id,
    winner_id,
    score_player1,
    score_player2,
    match_type,
    status,
    challenge_id,
    played_at
  ) VALUES (
    v_challenge.challenger_id,
    v_challenge.opponent_id,
    p_winner_id,
    p_challenger_score,
    p_opponent_score,
    'challenge',
    'completed',
    p_challenge_id,
    NOW()
  );
  
  -- Update daily stats
  INSERT INTO daily_challenge_stats (user_id, challenge_date, challenge_count, spa_points_earned)
  VALUES 
    (p_winner_id, CURRENT_DATE, 1, v_spa_change),
    (v_loser_id, CURRENT_DATE, 1, 0)
  ON CONFLICT (user_id, challenge_date) 
  DO UPDATE SET 
    challenge_count = daily_challenge_stats.challenge_count + 1,
    spa_points_earned = daily_challenge_stats.spa_points_earned + EXCLUDED.spa_points_earned;
  
  -- Notify both players
  INSERT INTO notifications (user_id, title, message, type, metadata)
  VALUES 
    (p_winner_id, 'Thắng thách đấu', 'Bạn đã thắng và nhận ' || v_spa_change || ' SPA điểm', 'challenge', jsonb_build_object('challenge_id', p_challenge_id)),
    (v_loser_id, 'Thua thách đấu', 'Bạn đã thua và mất ' || v_spa_change || ' SPA điểm', 'challenge', jsonb_build_object('challenge_id', p_challenge_id));
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', p_winner_id,
    'spa_change', v_spa_change,
    'elo_change', v_elo_change
  );
END;
$$;

-- Insert sample challenge data
INSERT INTO challenges (
  challenger_id,
  opponent_id,
  bet_points,
  race_to,
  message,
  status,
  expires_at,
  created_at
) 
SELECT 
  p1.user_id as challenger_id,
  p2.user_id as opponent_id,
  CASE 
    WHEN random() < 0.3 THEN 50
    WHEN random() < 0.6 THEN 100
    WHEN random() < 0.8 THEN 200
    ELSE 300
  END as bet_points,
  CASE 
    WHEN random() < 0.4 THEN 5
    WHEN random() < 0.7 THEN 8
    ELSE 10
  END as race_to,
  CASE 
    WHEN random() < 0.5 THEN 'Thách đấu kinh điển!'
    WHEN random() < 0.7 THEN 'Chúng ta cùng đấu nhé!'
    ELSE NULL
  END as message,
  CASE 
    WHEN random() < 0.3 THEN 'pending'
    WHEN random() < 0.6 THEN 'accepted'
    WHEN random() < 0.8 THEN 'completed'
    ELSE 'declined'
  END as status,
  NOW() + (random() * INTERVAL '7 days') as expires_at,
  NOW() - (random() * INTERVAL '30 days') as created_at
FROM 
  (SELECT user_id, ROW_NUMBER() OVER () as rn FROM profiles WHERE is_demo_user = false LIMIT 20) p1
CROSS JOIN 
  (SELECT user_id, ROW_NUMBER() OVER () as rn FROM profiles WHERE is_demo_user = false LIMIT 20) p2
WHERE p1.rn != p2.rn 
  AND p1.rn <= 10 
  AND p2.rn <= 10
  AND random() < 0.4  -- Only create 40% of possible combinations
LIMIT 15;