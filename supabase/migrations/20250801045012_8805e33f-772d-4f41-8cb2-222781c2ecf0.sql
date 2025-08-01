-- Phase 1: Add score columns to challenges table
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS challenger_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS opponent_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS winner_id uuid,
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Phase 2: Create challenge workflow automation function
CREATE OR REPLACE FUNCTION public.process_challenge_completion(
  p_challenge_id uuid,
  p_challenger_score integer,
  p_opponent_score integer,
  p_submitter_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Update challenge with scores and winner
  UPDATE challenges SET
    challenger_score = p_challenger_score,
    opponent_score = p_opponent_score,
    winner_id = v_winner_id,
    status = 'completed',
    completed_at = NOW()
  WHERE id = p_challenge_id;
  
  -- Award SPA points to winner
  v_points_to_award := COALESCE(v_challenge.bet_points, 100);
  
  -- Update winner's SPA points
  INSERT INTO spa_points_log (user_id, points_earned, category, description, challenge_id)
  VALUES (v_winner_id, v_points_to_award, 'challenge_victory', 'Thắng thách đấu', p_challenge_id);
  
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

-- Phase 3: Create automatic status transition trigger
CREATE OR REPLACE FUNCTION public.update_challenge_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-start challenges when accepted and scheduled time is reached
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    NEW.started_at = NOW();
    
    -- If no scheduled time, start immediately
    IF NEW.scheduled_time IS NULL OR NEW.scheduled_time <= NOW() THEN
      NEW.status = 'ongoing';
    END IF;
  END IF;
  
  -- Auto-expire old pending challenges
  IF NEW.status = 'pending' AND NEW.expires_at <= NOW() THEN
    NEW.status = 'expired';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for challenge status updates
DROP TRIGGER IF EXISTS challenge_status_update ON challenges;
CREATE TRIGGER challenge_status_update
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_status();

-- Phase 4: Create function to accept challenges
CREATE OR REPLACE FUNCTION public.accept_challenge(
  p_challenge_id uuid,
  p_user_id uuid,
  p_scheduled_time timestamp with time zone DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_challenge RECORD;
BEGIN
  -- Get challenge
  SELECT * INTO v_challenge 
  FROM challenges 
  WHERE id = p_challenge_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Challenge not found or already responded to');
  END IF;
  
  -- Check if user is the intended opponent or it's an open challenge
  IF v_challenge.opponent_id IS NOT NULL AND v_challenge.opponent_id != p_user_id THEN
    RETURN jsonb_build_object('error', 'You are not the intended opponent');
  END IF;
  
  -- Accept challenge
  UPDATE challenges SET
    opponent_id = p_user_id,
    status = 'accepted',
    responded_at = NOW(),
    scheduled_time = COALESCE(p_scheduled_time, NOW() + INTERVAL '10 minutes')
  WHERE id = p_challenge_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'status', 'accepted'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;