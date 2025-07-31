-- Phase 3: Workflow Automation System - Enhanced Database Functions

-- Create tournament state machine management function
CREATE OR REPLACE FUNCTION public.manage_tournament_state(
  p_tournament_id UUID,
  p_new_status TEXT,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_current_status TEXT;
  v_valid_transition BOOLEAN := FALSE;
  v_result JSONB;
BEGIN
  -- Get current tournament status
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  v_current_status := v_tournament.status;
  
  -- Validate state transitions
  CASE v_current_status
    WHEN 'registration_open' THEN
      v_valid_transition := p_new_status IN ('registration_closed', 'cancelled');
    WHEN 'registration_closed' THEN  
      v_valid_transition := p_new_status IN ('ongoing', 'cancelled');
    WHEN 'ongoing' THEN
      v_valid_transition := p_new_status IN ('completed', 'cancelled');
    WHEN 'completed' THEN
      v_valid_transition := FALSE; -- Cannot change from completed
    WHEN 'cancelled' THEN
      v_valid_transition := p_new_status IN ('registration_open'); -- Can restart
    ELSE
      v_valid_transition := TRUE; -- Allow any transition from unknown states
  END CASE;
  
  IF NOT v_valid_transition THEN
    RETURN jsonb_build_object(
      'error', 
      format('Invalid transition from %s to %s', v_current_status, p_new_status)
    );
  END IF;
  
  -- Update tournament status
  UPDATE public.tournaments 
  SET status = p_new_status,
      updated_at = NOW(),
      completed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE completed_at END
  WHERE id = p_tournament_id;
  
  -- Log state change
  INSERT INTO public.tournament_automation_log (
    tournament_id,
    automation_type,
    status,
    details,
    completed_at
  ) VALUES (
    p_tournament_id,
    'state_transition',
    'completed',
    jsonb_build_object(
      'from_status', v_current_status,
      'to_status', p_new_status,
      'admin_id', p_admin_id,
      'transition_time', NOW()
    ),
    NOW()
  );
  
  -- Additional actions based on new status
  CASE p_new_status
    WHEN 'ongoing' THEN
      -- Auto-generate bracket if not exists
      PERFORM public.generate_complete_tournament_bracket(p_tournament_id);
      
    WHEN 'completed' THEN
      -- Process tournament results
      PERFORM public.process_tournament_completion(p_tournament_id);
      
    ELSE
      NULL;
  END CASE;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'previous_status', v_current_status,
    'new_status', p_new_status,
    'transition_time', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('State transition failed: %s', SQLERRM)
    );
END;
$$;

-- Create comprehensive tournament recovery function
CREATE OR REPLACE FUNCTION public.recover_tournament_automation(
  p_tournament_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_recovered_count INTEGER := 0;
  v_results JSONB[] := '{}';
  v_recovery_result JSONB;
BEGIN
  -- If no specific tournament, find tournaments needing recovery
  IF p_tournament_id IS NULL THEN
    FOR v_tournament IN
      SELECT t.id, t.name, t.status, t.tournament_start
      FROM public.tournaments t
      WHERE t.status IN ('ongoing', 'registration_closed')
        AND EXISTS (
          SELECT 1 FROM public.tournament_matches tm 
          WHERE tm.tournament_id = t.id 
          AND tm.status = 'completed' 
          AND tm.winner_id IS NOT NULL
        )
      ORDER BY t.updated_at ASC
      LIMIT 10
    LOOP
      -- Fix progression for this tournament
      SELECT public.fix_all_tournament_progression(v_tournament.id) INTO v_recovery_result;
      
      v_results := v_results || v_recovery_result;
      v_recovered_count := v_recovered_count + 1;
      
      -- Log recovery attempt
      INSERT INTO public.tournament_automation_log (
        tournament_id,
        automation_type,
        status,
        details,
        completed_at
      ) VALUES (
        v_tournament.id,
        'tournament_recovery',
        CASE WHEN (v_recovery_result->>'success')::boolean THEN 'completed' ELSE 'failed' END,
        jsonb_build_object(
          'tournament_name', v_tournament.name,
          'recovery_result', v_recovery_result,
          'recovery_type', 'auto_scan'
        ),
        CASE WHEN (v_recovery_result->>'success')::boolean THEN NOW() ELSE NULL END
      );
    END LOOP;
  ELSE
    -- Fix specific tournament
    SELECT public.fix_all_tournament_progression(p_tournament_id) INTO v_recovery_result;
    v_results := v_results || v_recovery_result;
    v_recovered_count := CASE WHEN (v_recovery_result->>'success')::boolean THEN 1 ELSE 0 END;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'recovered_tournaments', v_recovered_count,
    'recovery_results', v_results,
    'recovery_time', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Recovery failed: %s', SQLERRM),
      'recovered_count', v_recovered_count
    );
END;
$$;

-- Create function to get comprehensive tournament automation status
CREATE OR REPLACE FUNCTION public.get_tournament_automation_status(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_matches RECORD;
  v_automation_stats JSONB;
  v_recent_logs JSONB[];
  v_log RECORD;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get match statistics
  SELECT 
    COUNT(*) as total_matches,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_matches,
    COUNT(*) FILTER (WHERE winner_id IS NOT NULL) as matches_with_winners,
    MIN(round_number) FILTER (WHERE status != 'completed') as current_round,
    MAX(round_number) as max_rounds,
    COUNT(DISTINCT round_number) as total_rounds
  INTO v_matches
  FROM public.tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Calculate progress percentage
  v_automation_stats := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'tournament_status', v_tournament.status,
    'total_matches', COALESCE(v_matches.total_matches, 0),
    'completed_matches', COALESCE(v_matches.completed_matches, 0),
    'matches_with_winners', COALESCE(v_matches.matches_with_winners, 0),
    'current_round', COALESCE(v_matches.current_round, 1),
    'max_rounds', COALESCE(v_matches.max_rounds, 1),
    'total_rounds', COALESCE(v_matches.total_rounds, 0),
    'progress_percentage', 
      CASE 
        WHEN COALESCE(v_matches.total_matches, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(v_matches.completed_matches, 0)::numeric / v_matches.total_matches::numeric) * 100)
      END,
    'is_completed', v_tournament.status = 'completed',
    'can_advance', 
      CASE 
        WHEN v_matches.current_round IS NULL THEN TRUE
        WHEN v_matches.current_round > v_matches.max_rounds THEN FALSE
        ELSE (
          SELECT COUNT(*) = 0 
          FROM public.tournament_matches 
          WHERE tournament_id = p_tournament_id 
          AND round_number = v_matches.current_round 
          AND status != 'completed'
        )
      END
  );
  
  -- Get recent automation logs
  v_recent_logs := '{}';
  FOR v_log IN
    SELECT automation_type, status, created_at, error_message
    FROM public.tournament_automation_log
    WHERE tournament_id = p_tournament_id
    ORDER BY created_at DESC
    LIMIT 10
  LOOP
    v_recent_logs := v_recent_logs || jsonb_build_object(
      'automation_type', v_log.automation_type,
      'status', v_log.status,
      'created_at', v_log.created_at,
      'error_message', v_log.error_message
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'automation_status', v_automation_stats,
    'recent_logs', v_recent_logs,
    'status_calculated_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to get automation status: %s', SQLERRM)
    );
END;
$$;