-- Update complete_tournament_automatically to use prize_distribution from tournament
CREATE OR REPLACE FUNCTION public.complete_tournament_automatically(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_final_match RECORD;
  v_results jsonb := '[]'::jsonb;
BEGIN
  -- Get tournament info including prize configuration
  SELECT id, name, status, tournament_type, prize_distribution, spa_points_config, elo_points_config 
  INTO v_tournament 
  FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Check if final match is completed
  SELECT * INTO v_final_match 
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND bracket_type = 'final' 
    AND status = 'completed'
    AND winner_id IS NOT NULL
  LIMIT 1;
  
  -- If no final match with bracket_type = 'final', find the highest round match
  IF NOT FOUND THEN
    SELECT * INTO v_final_match 
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND round_number = (
        SELECT MAX(round_number) 
        FROM tournament_matches 
        WHERE tournament_id = p_tournament_id
      )
      AND match_number = 1
      AND status = 'completed'
      AND winner_id IS NOT NULL
    LIMIT 1;
  END IF;
  
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
  
  -- Delete existing results
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Process tournament results with prize configuration
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
    tournament_id, user_id, final_position, 
    matches_played, matches_won, matches_lost,
    spa_points_earned, elo_points_earned, prize_amount
  )
  SELECT 
    p_tournament_id,
    pc.player_id,
    pc.final_position,
    pc.total_matches,
    pc.total_wins,
    pc.total_losses,
    -- Use spa_points_config from tournament or fallback to defaults
    COALESCE(
      (v_tournament.spa_points_config->>pc.final_position::text)::integer,
      (v_tournament.spa_points_config->>'default')::integer,
      CASE pc.final_position
        WHEN 1 THEN 1500
        WHEN 2 THEN 1000  
        WHEN 3 THEN 700
        WHEN 4 THEN 500
        ELSE 100
      END
    ) as spa_points,
    -- Use elo_points_config from tournament or fallback to defaults
    COALESCE(
      (v_tournament.elo_points_config->>pc.final_position::text)::integer,
      (v_tournament.elo_points_config->>'default')::integer,
      CASE pc.final_position
        WHEN 1 THEN 100
        WHEN 2 THEN 50
        WHEN 3 THEN 30
        WHEN 4 THEN 20
        ELSE 10
      END
    ) as elo_points,
    -- Use prize_distribution from tournament or fallback to defaults
    COALESCE(
      (v_tournament.prize_distribution->>pc.final_position::text)::numeric,
      (v_tournament.prize_distribution->>'default')::numeric,
      CASE pc.final_position
        WHEN 1 THEN 0
        WHEN 2 THEN 0
        WHEN 3 THEN 0
        WHEN 4 THEN 0
        ELSE 0
      END
    ) as prize_amount
  FROM position_calculated pc;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'status', 'completed',
    'message', 'Tournament completed with configured prizes'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to complete tournament: ' || SQLERRM
    );
END;
$$;