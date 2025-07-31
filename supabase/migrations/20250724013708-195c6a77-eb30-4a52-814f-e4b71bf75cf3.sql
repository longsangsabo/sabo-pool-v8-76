-- Fix complete_tournament_automatically to actually award points to players
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
  v_result_record RECORD;
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

  -- NOW ADD THE MISSING PART: Update player_rankings with earned points
  FOR v_result_record IN
    SELECT user_id, spa_points_earned, elo_points_earned, final_position
    FROM tournament_results 
    WHERE tournament_id = p_tournament_id
  LOOP
    -- Insert or update player_rankings
    INSERT INTO player_rankings (user_id, spa_points, elo_points, total_matches, wins, losses, updated_at)
    VALUES (
      v_result_record.user_id, 
      v_result_record.spa_points_earned, 
      v_result_record.elo_points_earned,
      1, -- tournament counts as 1 match for ranking purposes
      CASE WHEN v_result_record.final_position = 1 THEN 1 ELSE 0 END, -- only winner gets tournament win
      CASE WHEN v_result_record.final_position > 1 THEN 1 ELSE 0 END, -- others get tournament loss
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      spa_points = player_rankings.spa_points + v_result_record.spa_points_earned,
      elo_points = player_rankings.elo_points + v_result_record.elo_points_earned,
      updated_at = NOW();

    -- Log SPA points earned
    INSERT INTO spa_points_log (user_id, points_earned, category, description, reference_id)
    VALUES (
      v_result_record.user_id,
      v_result_record.spa_points_earned,
      'tournament',
      'Tournament: ' || v_tournament.name || ' - Position: ' || v_result_record.final_position,
      p_tournament_id
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'status', 'completed',
    'message', 'Tournament completed with configured prizes and points awarded'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to complete tournament: ' || SQLERRM
    );
END;
$$;

-- Create utility function to sync points from existing tournament results
CREATE OR REPLACE FUNCTION public.sync_tournament_points_to_rankings(p_tournament_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result_record RECORD;
  v_tournament_record RECORD;
  v_synced_count INTEGER := 0;
BEGIN
  -- If tournament_id provided, sync only that tournament, otherwise sync all
  FOR v_result_record IN
    SELECT tr.user_id, tr.spa_points_earned, tr.elo_points_earned, tr.final_position, tr.tournament_id, t.name as tournament_name
    FROM tournament_results tr
    JOIN tournaments t ON tr.tournament_id = t.id
    WHERE (p_tournament_id IS NULL OR tr.tournament_id = p_tournament_id)
  LOOP
    -- Insert or update player_rankings
    INSERT INTO player_rankings (user_id, spa_points, elo_points, total_matches, wins, losses, updated_at)
    VALUES (
      v_result_record.user_id, 
      v_result_record.spa_points_earned, 
      v_result_record.elo_points_earned,
      1,
      CASE WHEN v_result_record.final_position = 1 THEN 1 ELSE 0 END,
      CASE WHEN v_result_record.final_position > 1 THEN 1 ELSE 0 END,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      spa_points = player_rankings.spa_points + v_result_record.spa_points_earned,
      elo_points = player_rankings.elo_points + v_result_record.elo_points_earned,
      updated_at = NOW();

    -- Log SPA points earned (check if not already logged)
    IF NOT EXISTS (
      SELECT 1 FROM spa_points_log 
      WHERE user_id = v_result_record.user_id 
      AND reference_id = v_result_record.tournament_id 
      AND category = 'tournament'
    ) THEN
      INSERT INTO spa_points_log (user_id, points_earned, category, description, reference_id)
      VALUES (
        v_result_record.user_id,
        v_result_record.spa_points_earned,
        'tournament',
        'Tournament: ' || v_result_record.tournament_name || ' - Position: ' || v_result_record.final_position,
        v_result_record.tournament_id
      );
    END IF;

    v_synced_count := v_synced_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'synced_count', v_synced_count,
    'message', 'Tournament points synced to player rankings'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to sync tournament points: ' || SQLERRM
    );
END;
$$;

-- Run the sync function for the dqdq1 tournament to award missing points
SELECT public.sync_tournament_points_to_rankings('acddc309-6ab0-4da3-9243-d678ea46c091');