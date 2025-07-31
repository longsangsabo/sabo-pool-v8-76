-- Fix universal tournament completion function and force complete test2 tournament
-- Problem: Tournament has completed_at but no results, and function has field error

-- First, fix the function by removing the problematic field reference
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
  v_participant RECORD;
  v_position INTEGER;
  v_spa_points INTEGER;
  v_prize_amount NUMERIC;
BEGIN
  -- Get tournament info (works for any ID)
  SELECT * INTO v_tournament
  FROM tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Force update status to completed if not already
  UPDATE tournaments 
  SET status = 'completed', 
      updated_at = NOW()
  WHERE id = p_tournament_id 
  AND status != 'completed';
  
  -- Calculate universal results using existing function
  SELECT public.calculate_tournament_standings(p_tournament_id) INTO v_results;
  
  -- Build winners array (top 3)
  SELECT jsonb_agg(
    jsonb_build_object(
      'position', position,
      'player', jsonb_build_object(
        'id', user_id,
        'name', player_name,
        'avatar_url', null
      ),
      'prize', prize_money,
      'spa', spa_points,
      'elo_change', elo_change
    )
  ) INTO v_winners
  FROM tournament_results 
  WHERE tournament_id = p_tournament_id 
  AND position <= 3
  ORDER BY position;
  
  -- Build complete rankings
  SELECT jsonb_agg(
    jsonb_build_object(
      'position', position,
      'player', jsonb_build_object(
        'id', user_id,
        'name', player_name,
        'avatar_url', null
      ),
      'matches_played', matches_played,
      'matches_won', matches_won,
      'win_rate', ROUND((matches_won::NUMERIC / NULLIF(matches_played, 0) * 100), 1),
      'spa_points', spa_points,
      'prize_money', prize_money,
      'elo_change', elo_change
    )
  ) INTO v_rankings
  FROM tournament_results 
  WHERE tournament_id = p_tournament_id
  ORDER BY position;
  
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
    'total_spa_awarded', COALESCE(SUM(spa_points), 0),
    'duration_hours', EXTRACT(EPOCH FROM (v_tournament.tournament_end - v_tournament.tournament_start)) / 3600,
    'completion_rate', ROUND((COUNT(*)::NUMERIC / v_tournament.max_participants * 100), 1)
  ) INTO v_stats
  FROM tournament_results 
  WHERE tournament_id = p_tournament_id;
  
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

-- Now force complete the specific tournament test2
SELECT public.complete_any_tournament('acd33d20-b841-474d-a754-31a33647cc93'::uuid) as completion_result;