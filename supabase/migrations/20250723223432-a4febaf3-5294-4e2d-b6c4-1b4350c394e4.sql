-- Fix process_tournament_completion function
CREATE OR REPLACE FUNCTION public.process_tournament_completion(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_participant RECORD;
  v_match RECORD;
  v_position INTEGER;
  v_results_processed INTEGER := 0;
  v_champion_id UUID;
  v_runner_up_id UUID;
BEGIN
  -- Get champion (winner of final match)
  SELECT winner_id INTO v_champion_id
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND round_number = (SELECT MAX(round_number) FROM tournament_matches WHERE tournament_id = p_tournament_id)
  AND match_number = 1;
  
  -- Get runner-up (loser of final match)
  SELECT CASE 
    WHEN player1_id = v_champion_id THEN player2_id 
    ELSE player1_id 
  END INTO v_runner_up_id
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND round_number = (SELECT MAX(round_number) FROM tournament_matches WHERE tournament_id = p_tournament_id)
  AND match_number = 1;
  
  -- Clear existing results for this tournament
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Calculate results for all participants
  FOR v_participant IN
    SELECT tr.user_id
    FROM tournament_registrations tr
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed'
    AND tr.payment_status = 'paid'
  LOOP
    -- Determine position based on elimination round
    IF v_participant.user_id = v_champion_id THEN
      v_position := 1;
    ELSIF v_participant.user_id = v_runner_up_id THEN
      v_position := 2;
    ELSE
      -- Find the round where this player was eliminated
      SELECT MIN(tm.round_number) INTO v_position
      FROM tournament_matches tm
      WHERE tm.tournament_id = p_tournament_id
      AND (tm.player1_id = v_participant.user_id OR tm.player2_id = v_participant.user_id)
      AND tm.status = 'completed'
      AND tm.winner_id != v_participant.user_id;
      
      -- Convert elimination round to position
      -- Round 1 elimination = positions 9-16
      -- Round 2 elimination = positions 5-8  
      -- Round 3 elimination = positions 3-4
      IF v_position = 1 THEN
        v_position := 16; -- Simplified, should be more precise
      ELSIF v_position = 2 THEN
        v_position := 8;
      ELSIF v_position = 3 THEN
        v_position := 4;
      ELSE
        v_position := 16; -- Default fallback
      END IF;
    END IF;
    
    -- Calculate match statistics
    INSERT INTO tournament_results (
      tournament_id,
      user_id,
      final_position,
      matches_played,
      matches_won,
      matches_lost,
      win_percentage,
      spa_points_earned,
      elo_points_earned,
      prize_amount,
      physical_rewards,
      created_at,
      updated_at
    )
    SELECT 
      p_tournament_id,
      v_participant.user_id,
      v_position,
      COUNT(*) as matches_played,
      COUNT(*) FILTER (WHERE tm.winner_id = v_participant.user_id) as matches_won,
      COUNT(*) FILTER (WHERE tm.status = 'completed' AND tm.winner_id != v_participant.user_id) as matches_lost,
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (COUNT(*) FILTER (WHERE tm.winner_id = v_participant.user_id)::numeric / COUNT(*)::numeric) * 100
        ELSE 0 
      END as win_percentage,
      CASE 
        WHEN v_position = 1 THEN 1500
        WHEN v_position = 2 THEN 1000
        WHEN v_position <= 4 THEN 500
        WHEN v_position <= 8 THEN 200
        ELSE 100
      END as spa_points_earned,
      CASE 
        WHEN v_position = 1 THEN 100
        WHEN v_position = 2 THEN 75
        WHEN v_position <= 4 THEN 50
        ELSE 25
      END as elo_points_earned,
      0 as prize_amount,
      '[]'::jsonb as physical_rewards,
      NOW(),
      NOW()
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
    AND (tm.player1_id = v_participant.user_id OR tm.player2_id = v_participant.user_id)
    AND tm.status = 'completed';
    
    v_results_processed := v_results_processed + 1;
  END LOOP;
  
  -- Update player rankings with earned points
  UPDATE player_rankings pr
  SET spa_points = pr.spa_points + tr.spa_points_earned,
      elo_points = pr.elo_points + tr.elo_points_earned,
      updated_at = NOW()
  FROM tournament_results tr
  WHERE tr.tournament_id = p_tournament_id
  AND tr.user_id = pr.user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'results_processed', v_results_processed,
    'champion_id', v_champion_id,
    'runner_up_id', v_runner_up_id,
    'tournament_completed_at', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;