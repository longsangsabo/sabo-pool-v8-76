-- Fix tournament ranking calculation to ensure sequential 1-16 rankings
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
  v_third_place_players UUID[];
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Delete existing results
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Find final match to determine champion and runner-up
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
  
  -- Find third place match players (if exists)
  SELECT ARRAY[player1_id, player2_id] INTO v_third_place_players
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND is_third_place_match = true
    AND status = 'completed'
  LIMIT 1;
  
  -- Create results with proper sequential ranking
  WITH participant_stats AS (
    SELECT 
      tr.user_id,
      COUNT(tm.id) FILTER (WHERE (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) AND tm.status = 'completed') as matches_played,
      COUNT(tm.id) FILTER (WHERE tm.winner_id = tr.user_id) as matches_won,
      COUNT(tm.id) FILTER (WHERE (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) AND tm.status = 'completed' AND tm.winner_id != tr.user_id) as matches_lost,
      -- Find last round this player reached
      COALESCE(MAX(tm.round_number) FILTER (WHERE tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id), 0) as last_round_reached,
      -- Count wins in last round to break ties
      COUNT(tm.id) FILTER (WHERE tm.winner_id = tr.user_id AND tm.round_number = MAX(tm.round_number) FILTER (WHERE tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id)) as wins_in_last_round
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
        WHEN ps.matches_played > 0 THEN ROUND((ps.matches_won::numeric / ps.matches_played::numeric) * 100, 2)
        ELSE 0
      END as win_percentage,
      -- Assign positions based on performance with fixed champion/runner-up
      CASE 
        WHEN ps.user_id = v_champion_id THEN 1
        WHEN ps.user_id = v_runner_up_id THEN 2
        WHEN v_third_place_players IS NOT NULL AND ps.user_id = ANY(v_third_place_players) THEN 3
        ELSE 
          -- For all others, rank by: last_round_reached DESC, matches_won DESC, matches_lost ASC
          ROW_NUMBER() OVER (
            ORDER BY 
              ps.last_round_reached DESC,
              ps.matches_won DESC, 
              ps.matches_lost ASC,
              ps.user_id  -- Final tie-breaker for consistency
          ) + CASE 
            WHEN v_third_place_players IS NOT NULL THEN 3
            ELSE 2
          END
      END as final_position
    FROM participant_stats ps
    WHERE ps.user_id NOT IN (v_champion_id, v_runner_up_id)
       OR ps.user_id IN (v_champion_id, v_runner_up_id)
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
    -- SPA Points based on position
    CASE 
      WHEN pa.final_position = 1 THEN 1500  -- Champion
      WHEN pa.final_position = 2 THEN 1000  -- Runner-up
      WHEN pa.final_position = 3 THEN 700   -- Third place
      WHEN pa.final_position = 4 THEN 500   -- Fourth place
      WHEN pa.final_position <= 8 THEN 300  -- Top 8
      WHEN pa.final_position <= 12 THEN 200 -- Top 12
      ELSE 100                              -- Participation
    END as spa_points,
    -- ELO Points based on position
    CASE 
      WHEN pa.final_position = 1 THEN 100   -- Champion
      WHEN pa.final_position = 2 THEN 50    -- Runner-up
      WHEN pa.final_position = 3 THEN 30    -- Third place
      WHEN pa.final_position = 4 THEN 20    -- Fourth place
      WHEN pa.final_position <= 8 THEN 15   -- Top 8
      WHEN pa.final_position <= 12 THEN 10  -- Top 12
      ELSE 5                                -- Participation
    END as elo_points,
    -- Prize money based on position
    CASE 
      WHEN pa.final_position = 1 THEN 5000000   -- Champion: 5M VND
      WHEN pa.final_position = 2 THEN 3000000   -- Runner-up: 3M VND
      WHEN pa.final_position = 3 THEN 2000000   -- Third: 2M VND
      WHEN pa.final_position = 4 THEN 1000000   -- Fourth: 1M VND
      ELSE 0                                    -- No prize money
    END as prize_amount,
    -- Physical rewards
    CASE 
      WHEN pa.final_position = 1 THEN ARRAY['Cúp vô địch', 'Huy chương vàng']::text[]
      WHEN pa.final_position = 2 THEN ARRAY['Huy chương bạc']::text[]
      WHEN pa.final_position = 3 THEN ARRAY['Huy chương đồng']::text[]
      ELSE ARRAY[]::text[]
    END as physical_rewards
  FROM position_assigned pa
  ORDER BY pa.final_position;
  
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
    'message', 'Tournament results processed with sequential rankings'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to process tournament completion: ' || SQLERRM
    );
END;
$function$;

-- Re-run the function for the current tournament to fix rankings
SELECT public.process_tournament_completion(
  (SELECT id FROM tournaments WHERE name ILIKE '%SABO Pool 8 Ball%' ORDER BY created_at DESC LIMIT 1)
);