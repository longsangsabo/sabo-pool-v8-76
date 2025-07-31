-- Fix logic for tied third place when no third place match exists
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
  v_results jsonb := '[]'::jsonb;
  v_total_players INTEGER := 0;
  v_has_third_place_match BOOLEAN := false;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Check if final match is completed (for single elimination, get highest round)
  SELECT * INTO v_final_match 
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = (
      SELECT MAX(round_number) 
      FROM tournament_matches 
      WHERE tournament_id = p_tournament_id
    )
    AND status = 'completed'
    AND winner_id IS NOT NULL
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Final match not completed yet');
  END IF;
  
  -- Update tournament status to completed
  UPDATE tournaments 
  SET 
    status = 'completed',
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
  WHERE id = p_tournament_id AND status != 'completed';
  
  -- Check if tournament has third place match
  SELECT EXISTS (
    SELECT 1 FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND is_third_place_match = true
  ) INTO v_has_third_place_match;
  
  IF v_has_third_place_match THEN
    -- Get third place match winner if exists
    SELECT winner_id, 
           CASE 
             WHEN winner_id = player1_id THEN player2_id 
             ELSE player1_id 
           END as loser_id
    INTO v_third_place_winner_id, v_third_place_loser_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND is_third_place_match = true
      AND status = 'completed'
      AND winner_id IS NOT NULL
    LIMIT 1;
  ELSE
    -- No third place match - find semifinal losers for tied third place
    -- Find the round before final (semifinal round)
    WITH semifinal_round AS (
      SELECT MAX(round_number) - 1 as semifinal_round_num
      FROM tournament_matches 
      WHERE tournament_id = p_tournament_id
    )
    SELECT ARRAY_AGG(
      CASE 
        WHEN tm.winner_id = tm.player1_id THEN tm.player2_id 
        ELSE tm.player1_id 
      END
    ) INTO v_semifinal_losers
    FROM tournament_matches tm, semifinal_round sr
    WHERE tm.tournament_id = p_tournament_id
      AND tm.round_number = sr.semifinal_round_num
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL;
  END IF;
  
  -- Process tournament results with comprehensive position calculation
  WITH match_results AS (
    SELECT 
      tm.player1_id as player_id,
      COUNT(CASE WHEN tm.winner_id = tm.player1_id THEN 1 END) as wins,
      COUNT(CASE WHEN tm.status = 'completed' AND tm.winner_id != tm.player1_id THEN 1 END) as losses,
      COUNT(tm.id) as total_matches,
      MAX(tm.round_number) as highest_round_reached
    FROM tournament_matches tm
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
    FROM tournament_matches tm
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
  position_calc AS (
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
        
        -- All other positions: calculated by wins, then losses, then highest round
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
  INSERT INTO tournament_results (
    tournament_id, user_id, final_position, 
    matches_played, matches_won, matches_lost,
    spa_points_earned, elo_points_earned, prize_money
  )
  SELECT 
    p_tournament_id,
    pc.player_id,
    pc.final_position,
    pc.total_matches,
    pc.total_wins,
    pc.total_losses,
    CASE pc.final_position
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
    CASE pc.final_position
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
    CASE pc.final_position
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
  FROM position_calc pc
  ON CONFLICT (tournament_id, user_id) DO UPDATE SET
    final_position = EXCLUDED.final_position,
    matches_played = EXCLUDED.matches_played,
    matches_won = EXCLUDED.matches_won,
    matches_lost = EXCLUDED.matches_lost,
    spa_points_earned = EXCLUDED.spa_points_earned,
    elo_points_earned = EXCLUDED.elo_points_earned,
    prize_money = EXCLUDED.prize_money,
    updated_at = now();
  
  -- Get total players count
  SELECT COUNT(*) INTO v_total_players FROM position_calc;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'status', 'completed',
    'message', 'Tournament completed with proper third place handling',
    'total_players', v_total_players,
    'has_third_place_match', v_has_third_place_match,
    'semifinal_losers_count', COALESCE(array_length(v_semifinal_losers, 1), 0)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to complete tournament: ' || SQLERRM
    );
END;
$function$;