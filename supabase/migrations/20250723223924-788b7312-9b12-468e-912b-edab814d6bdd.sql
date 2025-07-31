-- Fix tournament position calculation to have proper ranking 1-16
CREATE OR REPLACE FUNCTION public.process_tournament_completion(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_participant RECORD;
  v_position INTEGER;
  v_results_processed INTEGER := 0;
  v_champion_id UUID;
  v_runner_up_id UUID;
  v_elimination_rounds RECORD;
  v_current_position INTEGER := 3; -- Start from position 3 after champion and runner-up
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
  
  -- Clear existing results
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Insert champion (Position 1)
  INSERT INTO tournament_results (
    tournament_id, user_id, final_position, matches_played, matches_won, matches_lost,
    win_percentage, spa_points_earned, elo_points_earned, prize_amount, physical_rewards
  )
  SELECT 
    p_tournament_id, v_champion_id, 1,
    COUNT(*), COUNT(*) FILTER (WHERE tm.winner_id = v_champion_id), 
    COUNT(*) FILTER (WHERE tm.status = 'completed' AND tm.winner_id != v_champion_id),
    CASE WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE tm.winner_id = v_champion_id)::numeric / COUNT(*)::numeric) * 100 ELSE 0 END,
    1500, 100, 0, '[]'::jsonb
  FROM tournament_matches tm
  WHERE tm.tournament_id = p_tournament_id AND (tm.player1_id = v_champion_id OR tm.player2_id = v_champion_id) AND tm.status = 'completed';
  
  -- Insert runner-up (Position 2)
  INSERT INTO tournament_results (
    tournament_id, user_id, final_position, matches_played, matches_won, matches_lost,
    win_percentage, spa_points_earned, elo_points_earned, prize_amount, physical_rewards
  )
  SELECT 
    p_tournament_id, v_runner_up_id, 2,
    COUNT(*), COUNT(*) FILTER (WHERE tm.winner_id = v_runner_up_id),
    COUNT(*) FILTER (WHERE tm.status = 'completed' AND tm.winner_id != v_runner_up_id),
    CASE WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE tm.winner_id = v_runner_up_id)::numeric / COUNT(*)::numeric) * 100 ELSE 0 END,
    1000, 75, 0, '[]'::jsonb
  FROM tournament_matches tm
  WHERE tm.tournament_id = p_tournament_id AND (tm.player1_id = v_runner_up_id OR tm.player2_id = v_runner_up_id) AND tm.status = 'completed';
  
  v_results_processed := 2;
  
  -- Process remaining participants by elimination round (in reverse order for proper ranking)
  FOR v_elimination_rounds IN
    SELECT elimination_round, array_agg(user_id ORDER BY user_id) as eliminated_users
    FROM (
      SELECT DISTINCT
        tr.user_id,
        COALESCE(
          (SELECT MIN(tm.round_number)
           FROM tournament_matches tm
           WHERE tm.tournament_id = p_tournament_id
           AND (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id)
           AND tm.status = 'completed'
           AND tm.winner_id != tr.user_id), 
          999
        ) as elimination_round
      FROM tournament_registrations tr
      WHERE tr.tournament_id = p_tournament_id 
      AND tr.registration_status = 'confirmed'
      AND tr.payment_status = 'paid'
      AND tr.user_id NOT IN (v_champion_id, v_runner_up_id)
    ) eliminated
    GROUP BY elimination_round
    ORDER BY elimination_round DESC -- Process later eliminations first (better positions)
  LOOP
    -- Assign positions to all users eliminated in this round
    FOR v_participant IN
      SELECT unnest(v_elimination_rounds.eliminated_users) as user_id
    LOOP
      INSERT INTO tournament_results (
        tournament_id, user_id, final_position, matches_played, matches_won, matches_lost,
        win_percentage, spa_points_earned, elo_points_earned, prize_amount, physical_rewards
      )
      SELECT 
        p_tournament_id, v_participant.user_id, v_current_position,
        COUNT(*), COUNT(*) FILTER (WHERE tm.winner_id = v_participant.user_id),
        COUNT(*) FILTER (WHERE tm.status = 'completed' AND tm.winner_id != v_participant.user_id),
        CASE WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE tm.winner_id = v_participant.user_id)::numeric / COUNT(*)::numeric) * 100 ELSE 0 END,
        CASE 
          WHEN v_current_position <= 4 THEN 500
          WHEN v_current_position <= 8 THEN 200
          ELSE 100
        END,
        CASE 
          WHEN v_current_position <= 4 THEN 50
          ELSE 25
        END,
        0, '[]'::jsonb
      FROM tournament_matches tm
      WHERE tm.tournament_id = p_tournament_id 
      AND (tm.player1_id = v_participant.user_id OR tm.player2_id = v_participant.user_id) 
      AND tm.status = 'completed';
      
      v_current_position := v_current_position + 1;
      v_results_processed := v_results_processed + 1;
    END LOOP;
  END LOOP;
  
  -- Update player rankings with earned points
  UPDATE player_rankings pr
  SET spa_points = pr.spa_points + tr.spa_points_earned,
      elo_points = pr.elo_points + tr.elo_points_earned,
      updated_at = NOW()
  FROM tournament_results tr
  WHERE tr.tournament_id = p_tournament_id AND tr.user_id = pr.user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'results_processed', v_results_processed,
    'champion_id', v_champion_id,
    'runner_up_id', v_runner_up_id,
    'tournament_completed_at', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;