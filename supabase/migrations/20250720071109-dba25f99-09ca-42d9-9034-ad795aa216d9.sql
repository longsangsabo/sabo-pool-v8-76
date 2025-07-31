
-- Step 1: Fix the complete_tournament_automatically function to ensure status update
CREATE OR REPLACE FUNCTION public.complete_tournament_automatically(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_final_match RECORD;
  v_third_place_winner_id UUID := NULL;
  v_third_place_loser_id UUID := NULL;
  v_semifinal_losers UUID[] := '{}';
  v_total_players INTEGER := 0;
  v_has_third_place_match BOOLEAN := false;
  v_results_inserted INTEGER := 0;
  v_players_updated INTEGER := 0;
  v_status_updated INTEGER := 0;
BEGIN
  -- Log function start
  RAISE NOTICE 'Starting tournament completion for tournament: %', p_tournament_id;
  
  -- Get tournament info with validation
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Tournament not found: %', p_tournament_id;
    RETURN jsonb_build_object('error', 'Tournament not found', 'tournament_id', p_tournament_id);
  END IF;
  
  RAISE NOTICE 'Tournament found: % (status: %)', v_tournament.name, v_tournament.status;
  
  -- Check if tournament is already completed
  IF v_tournament.status = 'completed' THEN
    RAISE NOTICE 'Tournament already completed';
    RETURN jsonb_build_object('success', true, 'message', 'Tournament is already completed', 'status', v_tournament.status);
  END IF;
  
  -- Check if final match is completed (get highest round match)
  SELECT * INTO v_final_match 
  FROM public.tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = (
      SELECT MAX(round_number) 
      FROM public.tournament_matches 
      WHERE tournament_id = p_tournament_id
    )
    AND status = 'completed'
    AND winner_id IS NOT NULL
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Final match not completed yet for tournament: %', p_tournament_id;
    RETURN jsonb_build_object('error', 'Final match not completed yet', 'tournament_id', p_tournament_id);
  END IF;
  
  RAISE NOTICE 'Final match found - Winner: %, Player1: %, Player2: %', v_final_match.winner_id, v_final_match.player1_id, v_final_match.player2_id;
  
  -- CRITICAL: Update tournament status to completed FIRST with explicit logging
  UPDATE public.tournaments 
  SET 
    status = 'completed',
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
  WHERE id = p_tournament_id;
  
  GET DIAGNOSTICS v_status_updated = ROW_COUNT;
  RAISE NOTICE 'Tournament status update attempted, rows affected: %', v_status_updated;
  
  -- Verify status was actually updated
  SELECT status INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  RAISE NOTICE 'Tournament status after update: %', v_tournament.status;
  
  IF v_tournament.status != 'completed' THEN
    RAISE NOTICE 'WARNING: Tournament status was not updated to completed!';
    RETURN jsonb_build_object(
      'error', 'Failed to update tournament status to completed',
      'current_status', v_tournament.status,
      'tournament_id', p_tournament_id
    );
  END IF;

  -- Continue with results processing...
  -- Check if tournament has third place match
  SELECT EXISTS (
    SELECT 1 FROM public.tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND is_third_place_match = true
  ) INTO v_has_third_place_match;
  
  RAISE NOTICE 'Has third place match: %', v_has_third_place_match;
  
  IF v_has_third_place_match THEN
    -- Get third place match results
    SELECT winner_id, 
           CASE 
             WHEN winner_id = player1_id THEN player2_id 
             ELSE player1_id 
           END as loser_id
    INTO v_third_place_winner_id, v_third_place_loser_id
    FROM public.tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND is_third_place_match = true
      AND status = 'completed'
      AND winner_id IS NOT NULL
    LIMIT 1;
    
    RAISE NOTICE 'Third place match - Winner: %, Loser: %', v_third_place_winner_id, v_third_place_loser_id;
  ELSE
    -- Find semifinal losers for tied third place
    WITH semifinal_round AS (
      SELECT MAX(round_number) - 1 as semifinal_round_num
      FROM public.tournament_matches 
      WHERE tournament_id = p_tournament_id
    )
    SELECT ARRAY_AGG(
      CASE 
        WHEN tm.winner_id = tm.player1_id THEN tm.player2_id 
        ELSE tm.player1_id 
      END
    ) INTO v_semifinal_losers
    FROM public.tournament_matches tm, semifinal_round sr
    WHERE tm.tournament_id = p_tournament_id
      AND tm.round_number = sr.semifinal_round_num
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL;
    
    RAISE NOTICE 'Semifinal losers: %', v_semifinal_losers;
  END IF;
  
  -- Create comprehensive tournament results with proper position calculation
  WITH match_results AS (
    SELECT 
      tm.player1_id as player_id,
      COUNT(CASE WHEN tm.winner_id = tm.player1_id THEN 1 END) as wins,
      COUNT(CASE WHEN tm.status = 'completed' AND tm.winner_id != tm.player1_id THEN 1 END) as losses,
      COUNT(tm.id) as total_matches,
      MAX(tm.round_number) as highest_round_reached
    FROM public.tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.status = 'completed'
      AND tm.player1_id IS NOT NULL
    GROUP BY tm.player1_id
    
    UNION ALL
    
    SELECT 
      tm.player2_id as player_id,
      COUNT(CASE WHEN tm.winner_id = tm.player2_id THEN 1 END) as wins,
      COUNT(CASE WHEN tm.status = 'completed' AND tm.winner_id != tm.player2_id THEN 1 END) as losses,
      COUNT(tm.id) as total_matches,
      MAX(tm.round_number) as highest_round_reached
    FROM public.tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.status = 'completed'
      AND tm.player2_id IS NOT NULL
    GROUP BY tm.player2_id
  ),
  player_aggregated AS (
    SELECT 
      player_id,
      SUM(wins) as total_wins,
      SUM(losses) as total_losses,
      SUM(total_matches) as total_matches,
      MAX(highest_round_reached) as highest_round_reached
    FROM match_results
    GROUP BY player_id
  ),
  final_positions_cte AS (
    SELECT 
      pa.*,
      CASE 
        -- Champion: Final match winner
        WHEN pa.player_id = v_final_match.winner_id THEN 1
        
        -- Runner-up: Final match loser
        WHEN pa.player_id IN (v_final_match.player1_id, v_final_match.player2_id) 
             AND pa.player_id != v_final_match.winner_id THEN 2
        
        -- Third place: Third place match winner (if exists)
        WHEN v_has_third_place_match AND v_third_place_winner_id IS NOT NULL 
             AND pa.player_id = v_third_place_winner_id THEN 3
        
        -- Fourth place: Third place match loser (if exists)
        WHEN v_has_third_place_match AND v_third_place_loser_id IS NOT NULL 
             AND pa.player_id = v_third_place_loser_id THEN 4
        
        -- Tied third place: Semifinal losers when no third place match
        WHEN NOT v_has_third_place_match AND v_semifinal_losers IS NOT NULL 
             AND pa.player_id = ANY(v_semifinal_losers) THEN 3
        
        -- All other positions: calculated by performance
        ELSE 
          CASE 
            WHEN v_has_third_place_match AND v_third_place_winner_id IS NOT NULL THEN 4
            WHEN NOT v_has_third_place_match AND v_semifinal_losers IS NOT NULL THEN 3
            ELSE 2 
          END + ROW_NUMBER() OVER (
            ORDER BY 
              pa.total_wins DESC, 
              pa.total_losses ASC, 
              pa.highest_round_reached DESC
          )
      END as final_position
    FROM player_aggregated pa
  )
  INSERT INTO public.tournament_results (
    tournament_id, user_id, final_position, 
    matches_played, matches_won, matches_lost,
    spa_points_earned, elo_points_earned, prize_money
  )
  SELECT 
    p_tournament_id,
    fp.player_id,
    fp.final_position,
    fp.total_matches,
    fp.total_wins,
    fp.total_losses,
    CASE fp.final_position
      WHEN 1 THEN 1500  -- Champion SPA points
      WHEN 2 THEN 1000  -- Runner-up SPA points
      WHEN 3 THEN 700   -- Third place SPA points (includes tied third)
      WHEN 4 THEN 500   -- Fourth place SPA points
      WHEN 5 THEN 300   -- Fifth place SPA points
      WHEN 6 THEN 250   -- Sixth place SPA points
      WHEN 7 THEN 200   -- Seventh place SPA points
      WHEN 8 THEN 150   -- Eighth place SPA points
      ELSE 100          -- All other positions get 100 SPA points
    END as spa_points,
    CASE fp.final_position
      WHEN 1 THEN 100   -- Champion ELO points
      WHEN 2 THEN 50    -- Runner-up ELO points
      WHEN 3 THEN 30    -- Third place ELO points (includes tied third)
      WHEN 4 THEN 20    -- Fourth place ELO points
      WHEN 5 THEN 15    -- Fifth place ELO points
      WHEN 6 THEN 12    -- Sixth place ELO points
      WHEN 7 THEN 10    -- Seventh place ELO points
      WHEN 8 THEN 8     -- Eighth place ELO points
      ELSE 5            -- All other positions get 5 ELO points
    END as elo_points,
    CASE fp.final_position
      WHEN 1 THEN 5000000   -- Champion prize money
      WHEN 2 THEN 3000000   -- Runner-up prize money
      WHEN 3 THEN 2000000   -- Third place prize money (shared for tied third)
      WHEN 4 THEN 1000000   -- Fourth place prize money
      WHEN 5 THEN 500000    -- Fifth place prize money
      WHEN 6 THEN 300000    -- Sixth place prize money
      WHEN 7 THEN 200000    -- Seventh place prize money
      WHEN 8 THEN 100000    -- Eighth place prize money
      ELSE 0                -- No prize money for other positions
    END as prize_money
  FROM final_positions_cte fp
  ON CONFLICT (tournament_id, user_id) DO UPDATE SET
    final_position = EXCLUDED.final_position,
    matches_played = EXCLUDED.matches_played,
    matches_won = EXCLUDED.matches_won,
    matches_lost = EXCLUDED.matches_lost,
    spa_points_earned = EXCLUDED.spa_points_earned,
    elo_points_earned = EXCLUDED.elo_points_earned,
    prize_money = EXCLUDED.prize_money,
    updated_at = now();
  
  GET DIAGNOSTICS v_results_inserted = ROW_COUNT;
  RAISE NOTICE 'Tournament results inserted/updated: % rows', v_results_inserted;
  
  -- Update player rankings with earned points (using correct column names)
  WITH tournament_players AS (
    SELECT 
      tr.user_id,
      tr.spa_points_earned,
      tr.elo_points_earned,
      tr.matches_won
    FROM public.tournament_results tr
    WHERE tr.tournament_id = p_tournament_id
  )
  UPDATE public.player_rankings pr
  SET 
    spa_points = COALESCE(pr.spa_points, 0) + tp.spa_points_earned,
    elo_points = COALESCE(pr.elo_points, 1000) + tp.elo_points_earned,
    total_matches = COALESCE(pr.total_matches, 0) + 1,
    wins = COALESCE(pr.wins, 0) + tp.matches_won,
    tournament_wins = CASE 
      WHEN tp.spa_points_earned >= 1500 THEN COALESCE(pr.tournament_wins, 0) + 1 
      ELSE COALESCE(pr.tournament_wins, 0) 
    END,
    updated_at = now()
  FROM tournament_players tp
  WHERE pr.user_id = tp.user_id;
  
  GET DIAGNOSTICS v_players_updated = ROW_COUNT;
  RAISE NOTICE 'Player rankings updated: % rows', v_players_updated;
  
  -- Insert new player rankings for players who don't have records
  INSERT INTO public.player_rankings (user_id, spa_points, elo_points, total_matches, wins, tournament_wins, created_at, updated_at)
  SELECT 
    tr.user_id,
    tr.spa_points_earned,
    1000 + tr.elo_points_earned,
    tr.matches_played,
    tr.matches_won,
    CASE WHEN tr.spa_points_earned >= 1500 THEN 1 ELSE 0 END,
    now(),
    now()
  FROM public.tournament_results tr
  WHERE tr.tournament_id = p_tournament_id
    AND NOT EXISTS (SELECT 1 FROM public.player_rankings pr WHERE pr.user_id = tr.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get total players count for response
  SELECT COUNT(*) INTO v_total_players 
  FROM public.tournament_results 
  WHERE tournament_id = p_tournament_id;
  
  -- Final status verification
  SELECT status INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  RAISE NOTICE 'Tournament completion successful - Status: %, Total players: %, Results: %, Rankings updated: %', 
    v_tournament.status, v_total_players, v_results_inserted, v_players_updated;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'status', 'completed',
    'message', 'Tournament completed successfully with all results saved',
    'total_players', v_total_players,
    'results_inserted', v_results_inserted,
    'rankings_updated', v_players_updated,
    'has_third_place_match', v_has_third_place_match,
    'final_match_winner', v_final_match.winner_id,
    'semifinal_losers_count', COALESCE(array_length(v_semifinal_losers, 1), 0),
    'final_status', v_tournament.status
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Tournament completion failed with error: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to complete tournament: ' || SQLERRM,
      'tournament_id', p_tournament_id,
      'sql_state', SQLSTATE,
      'context', 'Tournament completion function'
    );
END;
$function$;

-- Step 2: Create a manual status fix function as fallback
CREATE OR REPLACE FUNCTION public.force_tournament_completion_status(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_rows_affected INTEGER;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Force update status to completed
  UPDATE public.tournaments 
  SET 
    status = 'completed',
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
  WHERE id = p_tournament_id;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'old_status', v_tournament.status,
    'new_status', 'completed',
    'rows_affected', v_rows_affected,
    'message', 'Tournament status forcefully updated to completed'
  );
END;
$function$;
