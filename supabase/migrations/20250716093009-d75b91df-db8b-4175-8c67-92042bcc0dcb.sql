-- Universal Tournament Completion System
-- This replaces all tournament-specific logic with ONE universal system

-- Universal function to complete ANY tournament
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
      'total_prize', v_tournament.prize_pool,
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

-- Universal function to get tournament results (for any completed tournament)
CREATE OR REPLACE FUNCTION public.get_universal_tournament_results(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_results JSONB;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament
  FROM tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- If tournament is completed, return results
  IF v_tournament.status = 'completed' THEN
    -- Check if results exist
    IF EXISTS (SELECT 1 FROM tournament_results WHERE tournament_id = p_tournament_id) THEN
      -- Return existing results
      SELECT public.complete_any_tournament(p_tournament_id) INTO v_results;
      RETURN v_results;
    ELSE
      -- Calculate and store results
      PERFORM public.calculate_tournament_standings(p_tournament_id);
      SELECT public.complete_any_tournament(p_tournament_id) INTO v_results;
      RETURN v_results;
    END IF;
  ELSE
    -- Tournament not completed yet
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Tournament not completed yet',
      'status', v_tournament.status
    );
  END IF;
END;
$function$;