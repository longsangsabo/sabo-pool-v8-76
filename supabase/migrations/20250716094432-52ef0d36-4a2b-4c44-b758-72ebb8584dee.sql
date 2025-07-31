-- COMPREHENSIVE FIX: Tournament completion system
-- Root cause: complete_any_tournament queries empty tournament_results instead of inserting calculated data first

CREATE OR REPLACE FUNCTION public.complete_any_tournament(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_standings JSONB;
  v_winners JSONB;
  v_rankings JSONB;
  v_stats JSONB;
  v_standing RECORD;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament
  FROM tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Calculate standings using existing function
  SELECT public.calculate_tournament_standings(p_tournament_id) INTO v_standings;
  
  IF NOT (v_standings->>'success')::boolean THEN
    RETURN v_standings; -- Return error from calculate function
  END IF;
  
  -- CRITICAL FIX: Insert calculated results into tournament_results table
  -- Clear any existing results first
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Insert calculated standings into tournament_results
  INSERT INTO tournament_results (
    tournament_id,
    user_id,
    final_position,
    prize_money,
    spa_points_earned,
    elo_points_earned,
    matches_played,
    matches_won,
    matches_lost
  )
  SELECT 
    p_tournament_id,
    (standing->>'player_id')::uuid,
    (standing->>'final_position')::integer,
    (standing->>'prize_money')::integer,
    (standing->>'spa_points_earned')::integer,
    ROUND((standing->>'spa_points_earned')::numeric * 0.1)::integer, -- ELO = 10% of SPA
    (standing->>'total_matches')::integer,
    (standing->>'wins')::integer,
    (standing->>'losses')::integer
  FROM jsonb_array_elements(v_standings->'standings') as standing
  WHERE standing IS NOT NULL;
  
  -- Award rewards to players
  FOR v_standing IN 
    SELECT 
      (standing->>'player_id')::uuid as user_id,
      (standing->>'spa_points_earned')::integer as spa_points,
      ROUND((standing->>'spa_points_earned')::numeric * 0.1)::integer as elo_change,
      (standing->>'prize_money')::integer as prize_money,
      (standing->>'final_position')::integer as position
    FROM jsonb_array_elements(v_standings->'standings') as standing
    WHERE standing IS NOT NULL
  LOOP
    PERFORM public.award_tournament_rewards(
      v_standing.user_id,
      v_standing.spa_points,
      v_standing.elo_change,
      v_standing.prize_money,
      p_tournament_id,
      v_standing.position
    );
  END LOOP;
  
  -- NOW build winners array (top 3) from inserted data
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
  
  -- Build complete rankings from inserted data
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
  
  -- Calculate tournament stats from inserted data
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
    'completion_rate', ROUND((COUNT(*)::NUMERIC / NULLIF(v_tournament.max_participants, 0) * 100), 1)
  ) INTO v_stats
  FROM tournament_results 
  WHERE tournament_id = p_tournament_id;
  
  -- Mark tournament as completed
  UPDATE tournaments 
  SET status = 'completed', 
      tournament_end = CASE WHEN tournament_end IS NULL THEN NOW() ELSE tournament_end END,
      updated_at = NOW()
  WHERE id = p_tournament_id;
  
  -- Create completion notification
  INSERT INTO notifications (user_id, type, title, message, priority, metadata)
  SELECT DISTINCT
    tr.user_id,
    'tournament_completed',
    'Giải đấu đã kết thúc',
    'Giải đấu ' || v_tournament.name || ' đã kết thúc. Bạn đạt vị trí #' || tr.final_position,
    'high',
    jsonb_build_object(
      'tournament_id', p_tournament_id,
      'final_position', tr.final_position,
      'spa_earned', tr.spa_points_earned,
      'prize_money', tr.prize_money
    )
  FROM tournament_results tr
  WHERE tr.tournament_id = p_tournament_id;
  
  -- Log completion for monitoring
  INSERT INTO automation_performance_log (
    automation_type, tournament_id, success, execution_time_ms, metadata
  ) VALUES (
    'tournament_completion', p_tournament_id, true, 
    extract(epoch from clock_timestamp() - statement_timestamp()) * 1000,
    jsonb_build_object(
      'participants_count', (v_stats->>'total_participants')::integer,
      'matches_completed', (v_stats->>'total_matches')::integer
    )
  );
  
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
    -- Log error for debugging
    INSERT INTO automation_performance_log (
      automation_type, tournament_id, success, error_message, metadata
    ) VALUES (
      'tournament_completion', p_tournament_id, false, SQLERRM,
      jsonb_build_object('error_state', SQLSTATE)
    );
    
    RETURN jsonb_build_object(
      'success', false, 
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$function$;

-- Create trigger for automatic tournament completion
CREATE OR REPLACE FUNCTION public.auto_complete_tournament()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_matches INTEGER;
  v_completed_matches INTEGER;
  v_tournament_id UUID;
BEGIN
  -- Get tournament ID from the match
  v_tournament_id := NEW.tournament_id;
  
  -- Count total and completed matches for this tournament
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'completed' AND winner_id IS NOT NULL) as completed
  INTO v_total_matches, v_completed_matches
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id;
  
  -- If all matches are completed, trigger tournament completion
  IF v_completed_matches = v_total_matches AND v_total_matches > 0 THEN
    -- Use pg_notify to trigger async completion (prevents blocking)
    PERFORM pg_notify('tournament_complete', jsonb_build_object(
      'tournament_id', v_tournament_id,
      'trigger_time', NOW()
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on tournament_matches table
DROP TRIGGER IF EXISTS auto_complete_tournament_trigger ON tournament_matches;
CREATE TRIGGER auto_complete_tournament_trigger
  AFTER UPDATE OF status, winner_id ON tournament_matches
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.winner_id IS NOT NULL)
  EXECUTE FUNCTION auto_complete_tournament();

-- Create recovery function for missed tournaments
CREATE OR REPLACE FUNCTION public.recover_completed_tournaments()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament RECORD;
  v_results JSONB := '[]'::jsonb;
  v_result JSONB;
  v_recovered_count INTEGER := 0;
BEGIN
  -- Find tournaments that should be completed but aren't processed
  FOR v_tournament IN
    SELECT DISTINCT t.id, t.name
    FROM tournaments t
    WHERE t.status IN ('active', 'in_progress')
    AND NOT EXISTS (
      SELECT 1 FROM tournament_results tr WHERE tr.tournament_id = t.id
    )
    AND (
      SELECT COUNT(*) 
      FROM tournament_matches tm 
      WHERE tm.tournament_id = t.id 
      AND tm.status = 'completed' 
      AND tm.winner_id IS NOT NULL
    ) = (
      SELECT COUNT(*) 
      FROM tournament_matches tm2 
      WHERE tm2.tournament_id = t.id
    )
    AND (
      SELECT COUNT(*) FROM tournament_matches tm3 WHERE tm3.tournament_id = t.id
    ) > 0
  LOOP
    -- Attempt to complete the tournament
    SELECT public.complete_any_tournament(v_tournament.id) INTO v_result;
    
    v_results := v_results || jsonb_build_object(
      'tournament_id', v_tournament.id,
      'tournament_name', v_tournament.name,
      'result', v_result
    );
    
    IF (v_result->>'success')::boolean THEN
      v_recovered_count := v_recovered_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'recovered_count', v_recovered_count,
    'details', v_results
  );
END;
$$;