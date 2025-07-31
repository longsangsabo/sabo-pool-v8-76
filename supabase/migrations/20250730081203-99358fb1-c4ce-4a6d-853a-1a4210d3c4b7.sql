-- SABO System Cleanup and Monitoring (Fixed)
-- Fix SQL errors, clean up old data, and add monitoring functions

-- 1. Fix the get_15_task_system_status function (remove nested aggregates)
CREATE OR REPLACE FUNCTION public.get_15_task_system_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status JSONB := '{}';
  v_active_tournaments INTEGER;
  v_pending_matches INTEGER;
  v_completed_matches INTEGER;
  v_recent_automations INTEGER;
  v_errors INTEGER;
  v_trigger_exists BOOLEAN;
BEGIN
  -- Count active tournaments
  SELECT COUNT(*) INTO v_active_tournaments
  FROM tournaments 
  WHERE status IN ('ongoing', 'registration_closed');
  
  -- Count matches
  SELECT COUNT(*) FILTER (WHERE status != 'completed') INTO v_pending_matches
  FROM tournament_matches;
  
  SELECT COUNT(*) FILTER (WHERE status = 'completed') INTO v_completed_matches
  FROM tournament_matches;
  
  -- Count recent automations (last 24 hours)
  SELECT COUNT(*) INTO v_recent_automations
  FROM tournament_automation_log 
  WHERE created_at > NOW() - INTERVAL '24 hours';
  
  -- Count recent errors
  SELECT COUNT(*) INTO v_errors
  FROM tournament_automation_log 
  WHERE status = 'failed' 
  AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Check if main trigger exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'sabo_tournament_progression'
    AND event_object_table = 'tournament_matches'
  ) INTO v_trigger_exists;
  
  -- Build status
  v_status := jsonb_build_object(
    'system_status', 'operational',
    'timestamp', NOW(),
    'statistics', jsonb_build_object(
      'active_tournaments', v_active_tournaments,
      'pending_matches', v_pending_matches,
      'completed_matches', v_completed_matches,
      'recent_automations_24h', v_recent_automations,
      'recent_errors_24h', v_errors
    ),
    'health_checks', jsonb_build_object(
      'main_trigger_active', v_trigger_exists,
      'error_rate_acceptable', (v_errors::DECIMAL / GREATEST(v_recent_automations, 1)) < 0.1
    ),
    'next_actions', CASE 
      WHEN v_pending_matches > 0 THEN jsonb_build_array('Process pending matches')
      WHEN v_active_tournaments = 0 THEN jsonb_build_array('No active tournaments')
      ELSE jsonb_build_array('System monitoring')
    END
  );
  
  RETURN v_status;
END;
$$;

-- 2. Clean up old automation logs (keep only 15-task system logs from last 30 days)
DELETE FROM tournament_automation_log 
WHERE created_at < NOW() - INTERVAL '30 days'
OR (automation_type NOT LIKE '%15_task%' AND automation_type NOT LIKE '%sabo%');

-- 3. Drop old triggers that might conflict
DROP TRIGGER IF EXISTS notify_winner_advancement ON tournament_matches;
DROP TRIGGER IF EXISTS check_tournament_completion ON tournament_matches;
DROP TRIGGER IF EXISTS auto_advance_tournament ON tournament_matches;

-- 4. Verify and recreate the main trigger if needed
DROP TRIGGER IF EXISTS sabo_tournament_progression ON tournament_matches;
CREATE TRIGGER sabo_tournament_progression
  AFTER UPDATE OF winner_id, status ON tournament_matches
  FOR EACH ROW
  WHEN (NEW.winner_id IS NOT NULL AND NEW.status = 'completed')
  EXECUTE FUNCTION sabo_tournament_coordinator();

-- 5. Add system health monitoring function
CREATE OR REPLACE FUNCTION public.check_sabo_system_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_health JSONB;
  v_trigger_count INTEGER;
  v_function_count INTEGER;
  v_recent_errors INTEGER;
BEGIN
  -- Count triggers on tournament_matches
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers 
  WHERE event_object_table = 'tournament_matches';
  
  -- Count 15-task functions
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name LIKE '%15_task%';
  
  -- Count recent errors
  SELECT COUNT(*) INTO v_recent_errors
  FROM tournament_automation_log 
  WHERE status = 'failed' 
  AND created_at > NOW() - INTERVAL '1 hour';
  
  v_health := jsonb_build_object(
    'system_status', CASE 
      WHEN v_recent_errors > 5 THEN 'degraded'
      WHEN v_trigger_count != 1 THEN 'warning' 
      ELSE 'healthy'
    END,
    'checks', jsonb_build_object(
      'triggers_count', v_trigger_count,
      'functions_count', v_function_count,
      'recent_errors_1h', v_recent_errors,
      'main_trigger_exists', EXISTS(
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'sabo_tournament_progression'
      )
    ),
    'recommendations', CASE
      WHEN v_trigger_count > 1 THEN jsonb_build_array('Multiple triggers detected - cleanup needed')
      WHEN v_trigger_count = 0 THEN jsonb_build_array('Main trigger missing - recreation needed')
      WHEN v_recent_errors > 5 THEN jsonb_build_array('High error rate - investigate logs')
      ELSE jsonb_build_array('System operating normally')
    END,
    'checked_at', NOW()
  );
  
  RETURN v_health;
END;
$$;

-- 6. Add tournament debug function
CREATE OR REPLACE FUNCTION public.debug_tournament_state(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament RECORD;
  v_matches JSONB;
  v_automation_logs JSONB;
  v_debug_info JSONB;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get match summary by round
  SELECT jsonb_agg(
    jsonb_build_object(
      'round', round_number,
      'total_matches', COUNT(*),
      'completed', COUNT(*) FILTER (WHERE status = 'completed'),
      'pending', COUNT(*) FILTER (WHERE status != 'completed'),
      'with_winners', COUNT(*) FILTER (WHERE winner_id IS NOT NULL)
    ) ORDER BY round_number
  ) INTO v_matches
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
  GROUP BY round_number;
  
  -- Get recent automation logs
  SELECT jsonb_agg(
    jsonb_build_object(
      'automation_type', automation_type,
      'status', status,
      'created_at', created_at,
      'details', details
    ) ORDER BY created_at DESC
  ) INTO v_automation_logs
  FROM tournament_automation_log 
  WHERE tournament_id = p_tournament_id
  AND created_at > NOW() - INTERVAL '24 hours'
  LIMIT 10;
  
  v_debug_info := jsonb_build_object(
    'tournament', jsonb_build_object(
      'id', v_tournament.id,
      'name', v_tournament.name,
      'status', v_tournament.status,
      'type', v_tournament.tournament_type
    ),
    'matches_by_round', COALESCE(v_matches, '[]'::jsonb),
    'recent_automation_logs', COALESCE(v_automation_logs, '[]'::jsonb),
    'debug_timestamp', NOW()
  );
  
  RETURN v_debug_info;
END;
$$;

-- 7. Add cleanup utility function
CREATE OR REPLACE FUNCTION public.cleanup_old_tournament_data(p_days_to_keep INTEGER DEFAULT 90)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_logs INTEGER;
  v_deleted_metrics INTEGER;
BEGIN
  -- Clean old automation logs
  DELETE FROM tournament_automation_log 
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted_logs = ROW_COUNT;
  
  -- Clean old performance metrics
  DELETE FROM automation_performance_log 
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted_metrics = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_logs', v_deleted_logs,
    'deleted_metrics', v_deleted_metrics,
    'cleanup_date', NOW(),
    'days_kept', p_days_to_keep
  );
END;
$$;