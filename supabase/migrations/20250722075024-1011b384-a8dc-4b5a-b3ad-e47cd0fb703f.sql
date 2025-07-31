
-- Fix complete_tournament_automatically function to use actual tournament prize distribution
CREATE OR REPLACE FUNCTION public.complete_tournament_automatically(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_final_match RECORD;
  v_prize_distribution JSONB;
  v_spa_config JSONB;
  v_elo_config JSONB;
  v_results jsonb := '[]'::jsonb;
  v_participant RECORD;
BEGIN
  -- Get tournament info with prize configuration
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get prize distribution from tournament
  v_prize_distribution := COALESCE(v_tournament.prize_distribution, '{}'::jsonb);
  v_spa_config := COALESCE(v_tournament.spa_points_config, '{}'::jsonb);
  v_elo_config := COALESCE(v_tournament.elo_points_config, '{}'::jsonb);
  
  -- Check if final match is completed
  SELECT * INTO v_final_match 
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND bracket_type = 'final' 
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
  
  -- Process tournament results with actual prize distribution
  WITH match_results AS (
    SELECT 
      tm.player1_id as player_id,
      COUNT(CASE WHEN tm.winner_id = tm.player1_id THEN 1 END) as wins,
      COUNT(CASE WHEN tm.status = 'completed' AND tm.winner_id != tm.player1_id THEN 1 END) as losses,
      COUNT(tm.id) as total_matches
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
      COUNT(tm.id) as total_matches
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
      SUM(total_matches) as total_matches
    FROM match_results
    GROUP BY player_id
  ),
  position_calculated AS (
    SELECT 
      pa.*,
      CASE 
        WHEN pa.player_id = v_final_match.winner_id THEN 1
        WHEN pa.player_id IN (v_final_match.player1_id, v_final_match.player2_id) THEN 2
        ELSE ROW_NUMBER() OVER (ORDER BY pa.total_wins DESC, pa.total_losses ASC) + 2
      END as final_position
    FROM player_aggregated pa
  )
  INSERT INTO tournament_results (
    tournament_id, user_id, position, 
    matches_played, matches_won, matches_lost,
    spa_points_earned, elo_points_awarded, prize_money, physical_rewards
  )
  SELECT 
    p_tournament_id,
    pc.player_id,
    pc.final_position,
    pc.total_matches,
    pc.total_wins,
    pc.total_losses,
    -- Get SPA points from tournament config or use defaults
    CASE 
      WHEN v_spa_config->>'champion' IS NOT NULL AND pc.final_position = 1 THEN (v_spa_config->>'champion')::integer
      WHEN v_spa_config->>'runner_up' IS NOT NULL AND pc.final_position = 2 THEN (v_spa_config->>'runner_up')::integer
      WHEN v_spa_config->>'third_place' IS NOT NULL AND pc.final_position = 3 THEN (v_spa_config->>'third_place')::integer
      WHEN v_spa_config->>'top_8' IS NOT NULL AND pc.final_position <= 8 THEN (v_spa_config->>'top_8')::integer
      WHEN v_spa_config->>'participation' IS NOT NULL THEN (v_spa_config->>'participation')::integer
      ELSE 
        CASE pc.final_position
          WHEN 1 THEN 1500
          WHEN 2 THEN 1000  
          WHEN 3 THEN 700
          WHEN 4 THEN 500
          ELSE 100
        END
    END as spa_points,
    -- Get ELO points from tournament config or use defaults
    CASE 
      WHEN v_elo_config->>'champion' IS NOT NULL AND pc.final_position = 1 THEN (v_elo_config->>'champion')::integer
      WHEN v_elo_config->>'runner_up' IS NOT NULL AND pc.final_position = 2 THEN (v_elo_config->>'runner_up')::integer
      WHEN v_elo_config->>'third_place' IS NOT NULL AND pc.final_position = 3 THEN (v_elo_config->>'third_place')::integer
      WHEN v_elo_config->>'top_8' IS NOT NULL AND pc.final_position <= 8 THEN (v_elo_config->>'top_8')::integer
      WHEN v_elo_config->>'participation' IS NOT NULL THEN (v_elo_config->>'participation')::integer
      ELSE 
        CASE pc.final_position
          WHEN 1 THEN 100
          WHEN 2 THEN 50   
          WHEN 3 THEN 30   
          WHEN 4 THEN 20   
          ELSE 10
        END
    END as elo_points,
    -- Get prize money from tournament config or use defaults
    CASE 
      WHEN v_prize_distribution->>'first_place' IS NOT NULL AND pc.final_position = 1 THEN (v_prize_distribution->>'first_place')::numeric
      WHEN v_prize_distribution->>'second_place' IS NOT NULL AND pc.final_position = 2 THEN (v_prize_distribution->>'second_place')::numeric
      WHEN v_prize_distribution->>'third_place' IS NOT NULL AND pc.final_position = 3 THEN (v_prize_distribution->>'third_place')::numeric
      WHEN v_prize_distribution->>'fourth_place' IS NOT NULL AND pc.final_position = 4 THEN (v_prize_distribution->>'fourth_place')::numeric
      WHEN v_prize_distribution->>'participation' IS NOT NULL THEN (v_prize_distribution->>'participation')::numeric
      -- Try numeric format
      WHEN v_prize_distribution->>pc.final_position::text IS NOT NULL THEN (v_prize_distribution->>pc.final_position::text)::numeric
      WHEN v_prize_distribution->>'default' IS NOT NULL THEN (v_prize_distribution->>'default')::numeric
      ELSE 0
    END as prize_money,
    -- Set physical rewards based on position
    CASE pc.final_position
      WHEN 1 THEN '["Cúp vô địch", "Huy chương vàng", "Giấy chứng nhận"]'::jsonb
      WHEN 2 THEN '["Huy chương bạc", "Giấy chứng nhận"]'::jsonb
      WHEN 3 THEN '["Huy chương đồng", "Giấy chứng nhận"]'::jsonb
      ELSE '["Giấy chứng nhận"]'::jsonb
    END as physical_rewards
  FROM position_calculated pc
  ON CONFLICT (tournament_id, user_id) DO UPDATE SET
    position = EXCLUDED.position,
    matches_played = EXCLUDED.matches_played,
    matches_won = EXCLUDED.matches_won,
    matches_lost = EXCLUDED.matches_lost,
    spa_points_earned = EXCLUDED.spa_points_earned,
    elo_points_awarded = EXCLUDED.elo_points_awarded,
    prize_money = EXCLUDED.prize_money,
    physical_rewards = EXCLUDED.physical_rewards,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'status', 'completed',
    'message', 'Tournament completed with prize distribution from tournament config'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to complete tournament: ' || SQLERRM
    );
END;
$function$;
