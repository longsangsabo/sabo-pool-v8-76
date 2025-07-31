-- Add physical_rewards column to tournament_results table
ALTER TABLE public.tournament_results 
ADD COLUMN IF NOT EXISTS physical_rewards text[] DEFAULT '{}';

-- Update process_tournament_completion function to fix position gaps and include physical rewards
CREATE OR REPLACE FUNCTION public.process_tournament_completion(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_results_created INTEGER := 0;
  v_final_match RECORD;
  v_champion_id UUID;
  v_runner_up_id UUID;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Delete existing results to recalculate
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Find final match
  SELECT * INTO v_final_match
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = (SELECT MAX(round_number) FROM tournament_matches WHERE tournament_id = p_tournament_id)
    AND match_number = 1
    AND status = 'completed'
    AND winner_id IS NOT NULL;
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Final match not found or not completed');
  END IF;
  
  v_champion_id := v_final_match.winner_id;
  v_runner_up_id := CASE 
    WHEN v_final_match.player1_id = v_champion_id THEN v_final_match.player2_id 
    ELSE v_final_match.player1_id 
  END;
  
  -- Create results for all participants with match statistics and actual prize tier data
  WITH participant_stats AS (
    SELECT 
      tr.user_id,
      COUNT(tm.id) FILTER (WHERE (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) AND tm.status = 'completed') as matches_played,
      COUNT(tm.id) FILTER (WHERE tm.winner_id = tr.user_id) as matches_won,
      COUNT(tm.id) FILTER (WHERE (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) AND tm.status = 'completed' AND tm.winner_id != tr.user_id) as matches_lost
    FROM tournament_registrations tr
    LEFT JOIN tournament_matches tm ON tm.tournament_id = tr.tournament_id
    WHERE tr.tournament_id = p_tournament_id 
      AND tr.registration_status = 'confirmed'
    GROUP BY tr.user_id
  ),
  position_assigned AS (
    SELECT 
      ps.*,
      CASE 
        WHEN ps.user_id = v_champion_id THEN 1
        WHEN ps.user_id = v_runner_up_id THEN 2
        ELSE DENSE_RANK() OVER (ORDER BY ps.matches_won DESC, ps.matches_lost ASC) + 2
      END as final_position,
      CASE 
        WHEN ps.matches_played > 0 THEN ROUND((ps.matches_won::numeric / ps.matches_played::numeric) * 100, 2)
        ELSE 0
      END as win_percentage
    FROM participant_stats ps
  )
  INSERT INTO tournament_results (
    tournament_id, user_id, final_position,
    matches_played, matches_won, matches_lost, win_percentage,
    spa_points_earned, elo_points_earned, prize_amount, physical_rewards
  )
  SELECT 
    p_tournament_id,
    pa.user_id,
    pa.final_position,
    pa.matches_played,
    pa.matches_won,
    pa.matches_lost,
    pa.win_percentage,
    COALESCE(tpt.spa_points, 0) as spa_points,
    COALESCE(tpt.elo_points, 0) as elo_points,
    COALESCE(tpt.cash_amount, 0) as prize_amount,
    COALESCE(tpt.physical_items, '{}') as physical_rewards
  FROM position_assigned pa
  LEFT JOIN tournament_prize_tiers tpt ON (
    tpt.tournament_id = p_tournament_id 
    AND tpt.position = pa.final_position
  );
  
  GET DIAGNOSTICS v_results_created = ROW_COUNT;
  
  -- Update player rankings
  UPDATE player_rankings pr
  SET spa_points = pr.spa_points + tr.spa_points_earned,
      elo_points = pr.elo_points + tr.elo_points_earned,
      updated_at = NOW()
  FROM tournament_results tr
  WHERE tr.tournament_id = p_tournament_id 
    AND tr.user_id = pr.user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'results_created', v_results_created,
    'champion_id', v_champion_id,
    'runner_up_id', v_runner_up_id,
    'message', 'Tournament results processed with correct positions and physical rewards'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to process tournament completion: ' || SQLERRM
    );
END;
$function$;

-- Re-run the function for the SABO Pool 8 Ball tournament to fix position gaps
SELECT public.process_tournament_completion(
  (SELECT id FROM tournaments WHERE name ILIKE '%SABO Pool 8 Ball%' ORDER BY created_at DESC LIMIT 1)
);