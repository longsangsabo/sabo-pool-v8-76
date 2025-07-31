-- Update process_tournament_completion function to fix semifinalist identification and integrate with prize tiers
CREATE OR REPLACE FUNCTION public.process_tournament_completion(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_result JSONB;
  v_final_round INTEGER;
  v_champion_id UUID;
  v_runner_up_id UUID;
  v_semifinalists UUID[];
  v_position INTEGER;
  v_participant RECORD;
  v_prize_tier RECORD;
  v_has_prize_tiers BOOLEAN := FALSE;
  v_sync_result JSONB;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  RAISE NOTICE 'Processing completion for tournament: % (%)', v_tournament.name, p_tournament_id;
  
  -- Check if tournament has prize tiers configured
  SELECT EXISTS(SELECT 1 FROM tournament_prize_tiers WHERE tournament_id = p_tournament_id) INTO v_has_prize_tiers;
  
  -- Clear existing results
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Get final round
  SELECT MAX(round_number) INTO v_final_round
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  RAISE NOTICE 'Final round: %', v_final_round;
  
  -- Get champion (winner of final match)
  SELECT winner_id INTO v_champion_id
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND round_number = v_final_round 
  AND match_number = 1;
  
  -- Get runner-up (loser of final match)
  SELECT CASE WHEN player1_id = v_champion_id THEN player2_id ELSE player1_id END
  INTO v_runner_up_id
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND round_number = v_final_round 
  AND match_number = 1;
  
  RAISE NOTICE 'Champion: %, Runner-up: %', v_champion_id, v_runner_up_id;
  
  -- Award 1st place
  IF v_champion_id IS NOT NULL THEN
    -- Get prize tier data if available
    SELECT * INTO v_prize_tier FROM tournament_prize_tiers 
    WHERE tournament_id = p_tournament_id AND position = 1;
    
    INSERT INTO tournament_results (
      tournament_id, user_id, final_position, points_earned, prize_amount, 
      placement_type, created_at, updated_at
    ) VALUES (
      p_tournament_id, 
      v_champion_id, 
      1, 
      COALESCE(v_prize_tier.spa_points, 500), 
      COALESCE(v_prize_tier.cash_amount, COALESCE(v_tournament.prize_pool * 0.5, 0)), 
      'Vô địch', 
      NOW(), 
      NOW()
    );
    
    -- Update player rankings
    UPDATE player_rankings 
    SET spa_points = spa_points + COALESCE(v_prize_tier.spa_points, 500),
        elo_points = elo_points + COALESCE(v_prize_tier.elo_points, 100),
        wins = wins + 1,
        updated_at = NOW()
    WHERE user_id = v_champion_id;
  END IF;
  
  -- Award 2nd place
  IF v_runner_up_id IS NOT NULL THEN
    -- Get prize tier data if available
    SELECT * INTO v_prize_tier FROM tournament_prize_tiers 
    WHERE tournament_id = p_tournament_id AND position = 2;
    
    INSERT INTO tournament_results (
      tournament_id, user_id, final_position, points_earned, prize_amount, 
      placement_type, created_at, updated_at
    ) VALUES (
      p_tournament_id, 
      v_runner_up_id, 
      2, 
      COALESCE(v_prize_tier.spa_points, 300), 
      COALESCE(v_prize_tier.cash_amount, COALESCE(v_tournament.prize_pool * 0.3, 0)), 
      'Á quân', 
      NOW(), 
      NOW()
    );
    
    -- Update player rankings
    UPDATE player_rankings 
    SET spa_points = spa_points + COALESCE(v_prize_tier.spa_points, 300),
        elo_points = elo_points + COALESCE(v_prize_tier.elo_points, 75),
        updated_at = NOW()
    WHERE user_id = v_runner_up_id;
  END IF;
  
  -- Get semifinalists - FIXED: Use round 250 instead of v_final_round - 1
  SELECT array_agg(
    CASE WHEN player1_id != winner_id THEN player1_id ELSE player2_id END
  ) INTO v_semifinalists
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND round_number = 250  -- semifinals proper
  AND winner_id IS NOT NULL;
  
  RAISE NOTICE 'Semifinalists: %', v_semifinalists;
  
  -- Award 3rd and 4th place to semifinalists
  IF v_semifinalists IS NOT NULL AND array_length(v_semifinalists, 1) >= 1 THEN
    -- Award 3rd place
    SELECT * INTO v_prize_tier FROM tournament_prize_tiers 
    WHERE tournament_id = p_tournament_id AND position = 3;
    
    INSERT INTO tournament_results (
      tournament_id, user_id, final_position, points_earned, prize_amount, 
      placement_type, created_at, updated_at
    ) VALUES (
      p_tournament_id, 
      v_semifinalists[1], 
      3, 
      COALESCE(v_prize_tier.spa_points, 200), 
      COALESCE(v_prize_tier.cash_amount, COALESCE(v_tournament.prize_pool * 0.1, 0)), 
      'Hạng 3', 
      NOW(), 
      NOW()
    );
    
    -- Update player rankings
    UPDATE player_rankings 
    SET spa_points = spa_points + COALESCE(v_prize_tier.spa_points, 200),
        elo_points = elo_points + COALESCE(v_prize_tier.elo_points, 50),
        updated_at = NOW()
    WHERE user_id = v_semifinalists[1];
    
    -- Award 4th place if second semifinalist exists
    IF array_length(v_semifinalists, 1) >= 2 THEN
      SELECT * INTO v_prize_tier FROM tournament_prize_tiers 
      WHERE tournament_id = p_tournament_id AND position = 4;
      
      INSERT INTO tournament_results (
        tournament_id, user_id, final_position, points_earned, prize_amount, 
        placement_type, created_at, updated_at
      ) VALUES (
        p_tournament_id, 
        v_semifinalists[2], 
        4, 
        COALESCE(v_prize_tier.spa_points, 150), 
        COALESCE(v_prize_tier.cash_amount, COALESCE(v_tournament.prize_pool * 0.05, 0)), 
        'Hạng 4', 
        NOW(), 
        NOW()
      );
      
      -- Update player rankings
      UPDATE player_rankings 
      SET spa_points = spa_points + COALESCE(v_prize_tier.spa_points, 150),
          elo_points = elo_points + COALESCE(v_prize_tier.elo_points, 40),
          updated_at = NOW()
      WHERE user_id = v_semifinalists[2];
    END IF;
  END IF;
  
  -- Award participation points to remaining players - start from position 5
  v_position := 5;
  FOR v_participant IN
    SELECT DISTINCT user_id 
    FROM tournament_registrations 
    WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed'
    AND user_id NOT IN (
      SELECT user_id FROM tournament_results WHERE tournament_id = p_tournament_id
    )
  LOOP
    -- Get prize tier data if available
    SELECT * INTO v_prize_tier FROM tournament_prize_tiers 
    WHERE tournament_id = p_tournament_id AND position = v_position;
    
    INSERT INTO tournament_results (
      tournament_id, user_id, final_position, points_earned, prize_amount, 
      placement_type, created_at, updated_at
    ) VALUES (
      p_tournament_id, 
      v_participant.user_id, 
      v_position, 
      COALESCE(v_prize_tier.spa_points, 100), 
      COALESCE(v_prize_tier.cash_amount, 0), 
      CASE 
        WHEN v_prize_tier.position_name IS NOT NULL THEN v_prize_tier.position_name
        ELSE 'Hạng ' || v_position
      END, 
      NOW(), 
      NOW()
    );
    
    -- Update player rankings
    UPDATE player_rankings 
    SET spa_points = spa_points + COALESCE(v_prize_tier.spa_points, 100),
        elo_points = elo_points + COALESCE(v_prize_tier.elo_points, 15),
        total_matches = total_matches + 1,
        updated_at = NOW()
    WHERE user_id = v_participant.user_id;
    
    v_position := v_position + 1;
  END LOOP;
  
  -- Sync with prize tiers if they exist
  IF v_has_prize_tiers THEN
    SELECT public.sync_tournament_rewards_from_tiers(p_tournament_id) INTO v_sync_result;
    RAISE NOTICE 'Prize tiers sync result: %', v_sync_result;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'champion_id', v_champion_id,
    'runner_up_id', v_runner_up_id,
    'semifinalists', v_semifinalists,
    'results_created', true,
    'has_prize_tiers', v_has_prize_tiers,
    'sync_result', v_sync_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in process_tournament_completion: %', SQLERRM;
    RETURN jsonb_build_object(
      'error', format('Failed to process tournament completion: %s', SQLERRM),
      'tournament_id', p_tournament_id
    );
END;
$function$;