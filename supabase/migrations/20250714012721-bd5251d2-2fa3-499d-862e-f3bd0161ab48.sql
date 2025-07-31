-- Fix the complete challenge automation function with correct table structure
CREATE OR REPLACE FUNCTION public.complete_challenge_match_from_club_confirmation(p_challenge_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_challenge RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_winner_spa_before INTEGER;
  v_loser_spa_before INTEGER;
  v_winner_spa_after INTEGER;
  v_loser_spa_after INTEGER;
  v_winner_name TEXT;
  v_loser_name TEXT;
  v_result JSONB;
BEGIN
  -- Get challenge details
  SELECT * INTO v_challenge
  FROM public.challenges
  WHERE id = p_challenge_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Challenge not found', 'challenge_id', p_challenge_id);
  END IF;
  
  -- Validate challenge is confirmed and completed
  IF v_challenge.club_confirmed != true OR v_challenge.status != 'completed' THEN
    RETURN jsonb_build_object('error', 'Challenge not confirmed or completed', 'status', v_challenge.status, 'club_confirmed', v_challenge.club_confirmed);
  END IF;
  
  -- Check if already processed
  IF EXISTS (SELECT 1 FROM public.spa_points_log WHERE source_type = 'challenge' AND source_id = p_challenge_id) THEN
    RETURN jsonb_build_object('error', 'Challenge already processed', 'challenge_id', p_challenge_id);
  END IF;
  
  -- Determine winner and loser based on scores
  IF v_challenge.challenger_final_score > v_challenge.opponent_final_score THEN
    v_winner_id := v_challenge.challenger_id;
    v_loser_id := v_challenge.opponent_id;
  ELSE
    v_winner_id := v_challenge.opponent_id;
    v_loser_id := v_challenge.challenger_id;
  END IF;
  
  -- Get current SPA points from player_rankings
  SELECT COALESCE(spa_points, 0) INTO v_winner_spa_before
  FROM public.player_rankings
  WHERE user_id = v_winner_id;
  
  SELECT COALESCE(spa_points, 0) INTO v_loser_spa_before
  FROM public.player_rankings
  WHERE user_id = v_loser_id;
  
  -- Get player names
  SELECT full_name INTO v_winner_name FROM public.profiles WHERE user_id = v_winner_id;
  SELECT full_name INTO v_loser_name FROM public.profiles WHERE user_id = v_loser_id;
  
  -- Calculate new SPA points (winner gets bet_points, loser loses bet_points)
  v_winner_spa_after := v_winner_spa_before + v_challenge.bet_points;
  v_loser_spa_after := v_loser_spa_before - v_challenge.bet_points;
  
  -- Update player_rankings with new SPA points and stats
  UPDATE public.player_rankings
  SET 
    spa_points = v_winner_spa_after,
    wins = wins + 1,
    total_matches = total_matches + 1,
    updated_at = NOW()
  WHERE user_id = v_winner_id;
  
  UPDATE public.player_rankings
  SET 
    spa_points = v_loser_spa_after,
    total_matches = total_matches + 1,
    updated_at = NOW()
  WHERE user_id = v_loser_id;
  
  -- Log SPA transactions
  INSERT INTO public.spa_points_log (user_id, source_type, source_id, points_earned, description)
  VALUES 
    (v_winner_id, 'challenge', p_challenge_id, v_challenge.bet_points, 
     format('Thắng thách đấu vs %s (%s-%s)', v_loser_name, v_challenge.challenger_final_score, v_challenge.opponent_final_score)),
    (v_loser_id, 'challenge', p_challenge_id, -v_challenge.bet_points, 
     format('Thua thách đấu vs %s (%s-%s)', v_winner_name, v_challenge.challenger_final_score, v_challenge.opponent_final_score));
  
  -- Sync wallet points_balance with spa_points
  UPDATE public.wallets
  SET points_balance = v_winner_spa_after, updated_at = NOW()
  WHERE user_id = v_winner_id;
  
  UPDATE public.wallets
  SET points_balance = v_loser_spa_after, updated_at = NOW()
  WHERE user_id = v_loser_id;
  
  -- Log performance for debugging
  INSERT INTO public.automation_performance_log (automation_type, success, metadata)
  VALUES ('challenge_completion', true, jsonb_build_object(
    'challenge_id', p_challenge_id,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'bet_points', v_challenge.bet_points,
    'winner_spa_change', v_winner_spa_after - v_winner_spa_before,
    'loser_spa_change', v_loser_spa_after - v_loser_spa_before
  ));
  
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'winner_name', v_winner_name,
    'loser_name', v_loser_name,
    'bet_points', v_challenge.bet_points,
    'winner_spa_before', v_winner_spa_before,
    'winner_spa_after', v_winner_spa_after,
    'loser_spa_before', v_loser_spa_before,
    'loser_spa_after', v_loser_spa_after
  );
  
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO public.automation_performance_log (automation_type, success, error_message, metadata)
    VALUES ('challenge_completion', false, SQLERRM, jsonb_build_object(
      'challenge_id', p_challenge_id,
      'error', SQLERRM
    ));
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'challenge_id', p_challenge_id
    );
END;
$$;

-- Now process the historical challenges immediately
SELECT public.complete_challenge_match_from_club_confirmation('29a2ad3a-1f51-4123-baf9-56581ad20087');
SELECT public.complete_challenge_match_from_club_confirmation('5b93310b-d819-475b-b034-003c13e83d3a');