-- Fix tournament ranking calculation to ensure sequential 1-16 rankings with proper prize integration
CREATE OR REPLACE FUNCTION public.process_tournament_completion(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_results_created INTEGER := 0;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Delete existing results
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Create results with proper sequential ranking 1-16
  WITH participant_stats AS (
    SELECT 
      tr.user_id,
      COUNT(CASE WHEN (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) AND tm.status = 'completed' THEN 1 END) as matches_played,
      COUNT(CASE WHEN tm.winner_id = tr.user_id THEN 1 END) as matches_won,
      COUNT(CASE WHEN (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) AND tm.status = 'completed' AND tm.winner_id != tr.user_id THEN 1 END) as matches_lost
    FROM tournament_registrations tr
    LEFT JOIN tournament_matches tm ON tm.tournament_id = tr.tournament_id
    WHERE tr.tournament_id = p_tournament_id 
      AND tr.registration_status = 'confirmed'
    GROUP BY tr.user_id
  ),
  ranked_participants AS (
    SELECT 
      ps.*,
      CASE 
        WHEN ps.matches_played > 0 THEN ROUND((ps.matches_won::numeric / ps.matches_played::numeric) * 100, 2)
        ELSE 0
      END as win_percentage,
      -- Sequential ranking from 1 to 16 based on performance
      ROW_NUMBER() OVER (
        ORDER BY 
          ps.matches_won DESC,           -- Most wins first
          ps.matches_lost ASC,           -- Fewest losses second  
          CASE 
            WHEN ps.matches_played > 0 THEN (ps.matches_won::numeric / ps.matches_played::numeric) * 100
            ELSE 0
          END DESC,                      -- Highest win percentage third
          ps.user_id                     -- Consistent tie-breaker
      ) as final_position
    FROM participant_stats ps
  )
  INSERT INTO tournament_results (
    tournament_id, user_id, final_position,
    matches_played, matches_won, matches_lost, win_percentage,
    spa_points_earned, elo_points_earned, prize_amount, physical_rewards
  )
  SELECT 
    p_tournament_id,
    rp.user_id,
    rp.final_position,
    rp.matches_played,
    rp.matches_won,
    rp.matches_lost,
    rp.win_percentage,
    -- Get SPA points from prize tiers, fallback to defaults
    COALESCE(tpt.spa_points, 
      CASE 
        WHEN rp.final_position = 1 THEN 1500
        WHEN rp.final_position = 2 THEN 1000
        WHEN rp.final_position = 3 THEN 700
        WHEN rp.final_position = 4 THEN 500
        WHEN rp.final_position <= 8 THEN 300
        WHEN rp.final_position <= 12 THEN 200
        ELSE 100
      END
    ) as spa_points,
    -- Get ELO points from prize tiers, fallback to defaults  
    COALESCE(tpt.elo_points,
      CASE 
        WHEN rp.final_position = 1 THEN 100
        WHEN rp.final_position = 2 THEN 50
        WHEN rp.final_position = 3 THEN 30
        WHEN rp.final_position = 4 THEN 20
        WHEN rp.final_position <= 8 THEN 15
        WHEN rp.final_position <= 12 THEN 10
        ELSE 5
      END
    ) as elo_points,
    -- Get prize money from prize tiers, fallback to defaults
    COALESCE(tpt.cash_amount,
      CASE 
        WHEN rp.final_position = 1 THEN 5000000
        WHEN rp.final_position = 2 THEN 3000000
        WHEN rp.final_position = 3 THEN 2000000
        WHEN rp.final_position = 4 THEN 1000000
        ELSE 0
      END
    ) as prize_amount,
    -- Get physical rewards from prize tiers, fallback to defaults
    COALESCE(tpt.physical_items, 
      CASE 
        WHEN rp.final_position = 1 THEN ARRAY['Cúp vô địch', 'Huy chương vàng']::text[]
        WHEN rp.final_position = 2 THEN ARRAY['Huy chương bạc']::text[]
        WHEN rp.final_position = 3 THEN ARRAY['Huy chương đồng']::text[]
        ELSE ARRAY[]::text[]
      END
    ) as physical_rewards
  FROM ranked_participants rp
  LEFT JOIN tournament_prize_tiers tpt ON tpt.tournament_id = p_tournament_id AND tpt.position = rp.final_position
  ORDER BY rp.final_position;
  
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
    'message', 'Tournament results processed with sequential 1-16 rankings and proper prize integration'
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