-- Fix GROUP BY issue in universal tournament completion
CREATE OR REPLACE FUNCTION public.complete_any_tournament(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_results JSONB;
  v_winners JSONB;
  v_rankings JSONB;
  v_stats JSONB;
BEGIN
  -- Get tournament info (works for any ID)
  SELECT * INTO v_tournament
  FROM tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Calculate universal results using existing function
  SELECT public.calculate_tournament_standings(p_tournament_id) INTO v_results;
  
  -- Build winners array (top 3) - fixed query
  WITH ranked_winners AS (
    SELECT 
      tr.final_position,
      tr.user_id,
      tr.prize_money,
      tr.spa_points_earned,
      tr.elo_points_earned,
      COALESCE(p.full_name, p.display_name, 'Unknown Player') as player_name,
      p.avatar_url
    FROM tournament_results tr
    LEFT JOIN profiles p ON p.user_id = tr.user_id
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.final_position <= 3
    ORDER BY tr.final_position
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'position', final_position,
      'player', jsonb_build_object(
        'id', user_id,
        'name', player_name,
        'avatar_url', avatar_url
      ),
      'prize', COALESCE(prize_money, 0),
      'spa', COALESCE(spa_points_earned, 0),
      'elo_change', COALESCE(elo_points_earned, 0)
    )
  ) INTO v_winners
  FROM ranked_winners;
  
  -- Build complete rankings - fixed query
  WITH all_rankings AS (
    SELECT 
      tr.final_position,
      tr.user_id,
      tr.matches_played,
      tr.matches_won,
      tr.spa_points_earned,
      tr.prize_money,
      tr.elo_points_earned,
      COALESCE(p.full_name, p.display_name, 'Unknown Player') as player_name,
      p.avatar_url
    FROM tournament_results tr
    LEFT JOIN profiles p ON p.user_id = tr.user_id
    WHERE tr.tournament_id = p_tournament_id
    ORDER BY tr.final_position
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'position', final_position,
      'player', jsonb_build_object(
        'id', user_id,
        'name', player_name,
        'avatar_url', avatar_url
      ),
      'matches_played', COALESCE(matches_played, 0),
      'matches_won', COALESCE(matches_won, 0),
      'win_rate', CASE 
        WHEN COALESCE(matches_played, 0) > 0 
        THEN ROUND((COALESCE(matches_won, 0)::NUMERIC / matches_played * 100), 1)
        ELSE 0 
      END,
      'spa_points', COALESCE(spa_points_earned, 0),
      'prize_money', COALESCE(prize_money, 0),
      'elo_change', COALESCE(elo_points_earned, 0)
    )
  ) INTO v_rankings
  FROM all_rankings;
  
  -- Calculate tournament stats
  SELECT jsonb_build_object(
    'total_participants', COUNT(*),
    'total_matches', (
      SELECT COUNT(*) 
      FROM tournament_matches 
      WHERE tournament_id = p_tournament_id 
      AND status = 'completed'
    ),
    'total_prize_awarded', COALESCE(SUM(prize_money), 0),
    'total_spa_awarded', COALESCE(SUM(spa_points_earned), 0),
    'duration_hours', CASE 
      WHEN v_tournament.tournament_end IS NOT NULL AND v_tournament.tournament_start IS NOT NULL
      THEN EXTRACT(EPOCH FROM (v_tournament.tournament_end - v_tournament.tournament_start)) / 3600
      ELSE 0
    END,
    'completion_rate', ROUND((COUNT(*)::NUMERIC / v_tournament.max_participants * 100), 1)
  ) INTO v_stats
  FROM tournament_results 
  WHERE tournament_id = p_tournament_id;
  
  -- Mark tournament as completed if not already
  UPDATE tournaments 
  SET status = 'completed', 
      updated_at = NOW()
  WHERE id = p_tournament_id 
  AND status != 'completed';
  
  -- Return universal tournament result structure
  RETURN jsonb_build_object(
    'success', true,
    'tournament', jsonb_build_object(
      'id', v_tournament.id,
      'name', v_tournament.name,
      'status', 'completed',
      'completed_at', NOW(),
      'total_prize', COALESCE(v_tournament.prize_pool, 0),
      'max_participants', v_tournament.max_participants,
      'tournament_type', v_tournament.tournament_type,
      'tier_level', v_tournament.tier_level
    ),
    'winners', COALESCE(v_winners, '[]'::jsonb),
    'rankings', COALESCE(v_rankings, '[]'::jsonb),
    'stats', COALESCE(v_stats, '{}'::jsonb)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', SQLERRM
    );
END;
$function$;