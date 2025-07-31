-- Phase 4: Enhanced Monitoring & Debugging - Support Functions

-- Create function to check if automation triggers are working
CREATE OR REPLACE FUNCTION public.check_automation_triggers_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_triggers RECORD;
  v_active_triggers INTEGER := 0;
  v_trigger_info JSONB[] := '{}';
BEGIN
  -- Check for active triggers on tournament_matches table
  FOR v_triggers IN
    SELECT 
      trigger_name,
      event_manipulation,
      action_statement,
      action_timing
    FROM information_schema.triggers 
    WHERE event_object_table = 'tournament_matches'
    AND trigger_schema = 'public'
  LOOP
    v_active_triggers := v_active_triggers + 1;
    v_trigger_info := v_trigger_info || jsonb_build_object(
      'name', v_triggers.trigger_name,
      'event', v_triggers.event_manipulation,
      'timing', v_triggers.action_timing,
      'function', v_triggers.action_statement
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'active_triggers', v_active_triggers,
    'trigger_details', v_trigger_info,
    'status', CASE WHEN v_active_triggers > 0 THEN 'active' ELSE 'inactive' END,
    'checked_at', NOW()
  );
END;
$$;

-- Create function to identify tournaments needing attention
CREATE OR REPLACE FUNCTION public.get_tournaments_needing_attention()
RETURNS TABLE(
  tournament_id UUID,
  tournament_name TEXT,
  status TEXT,
  issue_type TEXT,
  issue_description TEXT,
  matches_completed INTEGER,
  matches_total INTEGER,
  current_round INTEGER,
  max_rounds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as tournament_id,
    t.name as tournament_name,
    t.status,
    CASE 
      WHEN t.status = 'ongoing' AND completed_matches.count = total_matches.count AND total_matches.count > 0 THEN 'completion_needed'
      WHEN progression_issues.has_issues THEN 'progression_issue'
      WHEN t.status = 'ongoing' AND total_matches.count = 0 THEN 'no_matches'
      ELSE 'unknown'
    END as issue_type,
    CASE 
      WHEN t.status = 'ongoing' AND completed_matches.count = total_matches.count AND total_matches.count > 0 THEN 'All matches completed but tournament still ongoing'
      WHEN progression_issues.has_issues THEN 'Winners not advanced to next round'
      WHEN t.status = 'ongoing' AND total_matches.count = 0 THEN 'Tournament ongoing but no matches exist'
      ELSE 'Unknown issue'
    END as issue_description,
    COALESCE(completed_matches.count, 0) as matches_completed,
    COALESCE(total_matches.count, 0) as matches_total,
    COALESCE(current_round.min_round, 1) as current_round,
    COALESCE(max_round.max_round, 1) as max_rounds
  FROM public.tournaments t
  
  -- Get completed matches count
  LEFT JOIN (
    SELECT 
      tournament_id, 
      COUNT(*) as count
    FROM public.tournament_matches 
    WHERE status = 'completed'
    GROUP BY tournament_id
  ) completed_matches ON t.id = completed_matches.tournament_id
  
  -- Get total matches count  
  LEFT JOIN (
    SELECT 
      tournament_id, 
      COUNT(*) as count
    FROM public.tournament_matches
    GROUP BY tournament_id
  ) total_matches ON t.id = total_matches.tournament_id
  
  -- Get current round
  LEFT JOIN (
    SELECT 
      tournament_id,
      MIN(round_number) as min_round
    FROM public.tournament_matches
    WHERE status != 'completed'
    GROUP BY tournament_id
  ) current_round ON t.id = current_round.tournament_id
  
  -- Get max round
  LEFT JOIN (
    SELECT 
      tournament_id,
      MAX(round_number) as max_round
    FROM public.tournament_matches
    GROUP BY tournament_id
  ) max_round ON t.id = max_round.tournament_id
  
  -- Check for progression issues
  LEFT JOIN (
    SELECT DISTINCT
      tm1.tournament_id,
      TRUE as has_issues
    FROM public.tournament_matches tm1
    WHERE tm1.status = 'completed' 
    AND tm1.winner_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.tournament_matches tm2 
      WHERE tm2.tournament_id = tm1.tournament_id
      AND tm2.round_number = tm1.round_number + 1
      AND (tm2.player1_id IS NULL OR tm2.player2_id IS NULL)
    )
  ) progression_issues ON t.id = progression_issues.tournament_id
  
  WHERE t.status IN ('ongoing', 'registration_closed')
  AND (
    (t.status = 'ongoing' AND completed_matches.count = total_matches.count AND total_matches.count > 0)
    OR progression_issues.has_issues = TRUE
    OR (t.status = 'ongoing' AND total_matches.count = 0)
  )
  ORDER BY t.updated_at DESC;
END;
$$;

-- Create performance monitoring view
CREATE OR REPLACE VIEW public.automation_performance_summary AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour_bucket,
  automation_type,
  COUNT(*) as total_operations,
  COUNT(*) FILTER (WHERE success = true) as successful_operations,
  COUNT(*) FILTER (WHERE success = false) as failed_operations,
  ROUND(AVG(execution_time_ms)) as avg_execution_time_ms,
  MAX(execution_time_ms) as max_execution_time_ms,
  MIN(execution_time_ms) as min_execution_time_ms
FROM public.automation_performance_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), automation_type
ORDER BY hour_bucket DESC, automation_type;

-- Grant select permissions on the view
GRANT SELECT ON public.automation_performance_summary TO authenticated;

-- Create function to cleanup old logs (for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_automation_logs(
  p_days_to_keep INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete old automation logs
  DELETE FROM public.tournament_automation_log 
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Delete old performance logs
  DELETE FROM public.automation_performance_log 
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_records', v_deleted_count,
    'cleanup_date', NOW(),
    'days_kept', p_days_to_keep
  );
END;
$$;

-- Create index for better performance on automation logs
CREATE INDEX IF NOT EXISTS idx_tournament_automation_log_tournament_created 
ON public.tournament_automation_log(tournament_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_performance_log_created_success 
ON public.automation_performance_log(created_at DESC, success);

-- Add real-time publication for monitoring tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_automation_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_performance_log;