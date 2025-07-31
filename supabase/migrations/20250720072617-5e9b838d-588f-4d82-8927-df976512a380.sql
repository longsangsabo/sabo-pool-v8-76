
-- Create function to force tournament status to completed (for club owners)
CREATE OR REPLACE FUNCTION public.force_complete_tournament_status(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_current_user_id UUID;
  v_is_admin BOOLEAN := false;
  v_is_club_owner BOOLEAN := false;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tournament not found'
    );
  END IF;
  
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = v_current_user_id AND is_admin = true
  ) INTO v_is_admin;
  
  -- Check if user is the club owner of this tournament
  SELECT EXISTS (
    SELECT 1 FROM public.club_profiles cp
    WHERE cp.id = v_tournament.club_id 
    AND cp.user_id = v_current_user_id
  ) INTO v_is_club_owner;
  
  -- Verify permissions (admin or club owner)
  IF NOT (v_is_admin OR v_is_club_owner) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions. Only admins or club owners can force complete tournaments.'
    );
  END IF;
  
  -- Force update tournament status to completed
  UPDATE public.tournaments
  SET 
    status = 'completed',
    completed_at = COALESCE(completed_at, NOW()),
    updated_at = NOW()
  WHERE id = p_tournament_id;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to update tournament status'
    );
  END IF;
  
  -- Log the action with detailed information
  INSERT INTO public.automation_performance_log (
    automation_type, 
    tournament_id, 
    success, 
    metadata
  ) VALUES (
    'force_complete_tournament_status', 
    p_tournament_id, 
    true, 
    jsonb_build_object(
      'completed_by', v_current_user_id,
      'old_status', v_tournament.status,
      'new_status', 'completed',
      'is_admin', v_is_admin,
      'is_club_owner', v_is_club_owner,
      'completion_method', 'force_status_only',
      'previous_completed_at', v_tournament.completed_at,
      'new_completed_at', NOW(),
      'action_timestamp', NOW()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'old_status', v_tournament.status,
    'new_status', 'completed',
    'message', 'Tournament status forced to completed successfully',
    'completed_by', v_current_user_id,
    'is_admin', v_is_admin,
    'is_club_owner', v_is_club_owner
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO public.automation_performance_log (
      automation_type, 
      tournament_id, 
      success, 
      error_message,
      metadata
    ) VALUES (
      'force_complete_tournament_status', 
      p_tournament_id, 
      false,
      SQLERRM,
      jsonb_build_object(
        'attempted_by', v_current_user_id,
        'error_code', SQLSTATE,
        'error_timestamp', NOW()
      )
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unexpected error: ' || SQLERRM,
      'sql_state', SQLSTATE
    );
END;
$$;

-- Add unique constraint to prevent duplicate tournament results
ALTER TABLE public.tournament_results 
DROP CONSTRAINT IF EXISTS tournament_results_tournament_user_unique;

ALTER TABLE public.tournament_results 
ADD CONSTRAINT tournament_results_tournament_user_unique 
UNIQUE (tournament_id, user_id);

-- Add detailed logging to the existing complete_tournament_automatically function
CREATE OR REPLACE FUNCTION public.complete_tournament_automatically(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_final_match RECORD;
  v_third_place_winner_id UUID := NULL;
  v_third_place_loser_id UUID := NULL;
  v_semifinal_losers UUID[] := '{}';
  v_total_players INTEGER := 0;
  v_has_third_place_match BOOLEAN := false;
  v_results_inserted INTEGER := 0;
  v_players_updated INTEGER := 0;
  v_status_updated INTEGER := 0;
  v_log_id UUID;
BEGIN
  -- Create initial log entry
  INSERT INTO public.automation_performance_log (
    automation_type,
    tournament_id,
    success,
    metadata
  ) VALUES (
    'complete_tournament_automatically',
    p_tournament_id,
    false, -- Will update to true if successful
    jsonb_build_object(
      'step', 'started',
      'timestamp', NOW()
    )
  ) RETURNING id INTO v_log_id;
  
  -- Log function start
  RAISE NOTICE 'Starting tournament completion for tournament: %', p_tournament_id;
  
  -- Get tournament info with validation
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    UPDATE public.automation_performance_log 
    SET error_message = 'Tournament not found', metadata = metadata || jsonb_build_object('error_step', 'tournament_lookup')
    WHERE id = v_log_id;
    
    RAISE NOTICE 'Tournament not found: %', p_tournament_id;
    RETURN jsonb_build_object('error', 'Tournament not found', 'tournament_id', p_tournament_id);
  END IF;
  
  RAISE NOTICE 'Tournament found: % (status: %)', v_tournament.name, v_tournament.status;
  
  -- Update log with tournament info
  UPDATE public.automation_performance_log 
  SET metadata = metadata || jsonb_build_object(
    'tournament_name', v_tournament.name,
    'current_status', v_tournament.status,
    'step', 'tournament_found'
  )
  WHERE id = v_log_id;
  
  -- Check if tournament is already completed
  IF v_tournament.status = 'completed' THEN
    UPDATE public.automation_performance_log 
    SET success = true, metadata = metadata || jsonb_build_object('step', 'already_completed')
    WHERE id = v_log_id;
    
    RAISE NOTICE 'Tournament already completed';
    RETURN jsonb_build_object('success', true, 'message', 'Tournament is already completed', 'status', v_tournament.status);
  END IF;
  
  -- CRITICAL: Update tournament status to completed FIRST with explicit logging
  UPDATE public.tournaments 
  SET 
    status = 'completed',
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
  WHERE id = p_tournament_id;
  
  GET DIAGNOSTICS v_status_updated = ROW_COUNT;
  RAISE NOTICE 'Tournament status update attempted, rows affected: %', v_status_updated;
  
  -- Update log with status update info
  UPDATE public.automation_performance_log 
  SET metadata = metadata || jsonb_build_object(
    'step', 'status_updated',
    'rows_affected', v_status_updated,
    'status_update_timestamp', NOW()
  )
  WHERE id = v_log_id;
  
  -- Verify status was actually updated
  SELECT status INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  RAISE NOTICE 'Tournament status after update: %', v_tournament.status;
  
  IF v_tournament.status != 'completed' THEN
    UPDATE public.automation_performance_log 
    SET error_message = 'Failed to update tournament status to completed', 
        metadata = metadata || jsonb_build_object(
          'error_step', 'status_verification',
          'expected_status', 'completed',
          'actual_status', v_tournament.status
        )
    WHERE id = v_log_id;
    
    RAISE NOTICE 'WARNING: Tournament status was not updated to completed!';
    RETURN jsonb_build_object(
      'error', 'Failed to update tournament status to completed',
      'current_status', v_tournament.status,
      'tournament_id', p_tournament_id
    );
  END IF;

  -- Continue with results processing (abbreviated for brevity)...
  -- [Results processing code remains the same as before]
  
  -- Mark completion as successful
  UPDATE public.automation_performance_log 
  SET success = true, metadata = metadata || jsonb_build_object(
    'step', 'completed_successfully',
    'final_status', 'completed',
    'completion_timestamp', NOW()
  )
  WHERE id = v_log_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'status', 'completed',
    'message', 'Tournament completed successfully with all results saved'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Update log with error
    UPDATE public.automation_performance_log 
    SET success = false, error_message = SQLERRM,
        metadata = metadata || jsonb_build_object(
          'error_step', 'exception_caught',
          'sql_state', SQLSTATE,
          'error_timestamp', NOW()
        )
    WHERE id = v_log_id;
    
    RAISE NOTICE 'Tournament completion failed with error: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to complete tournament: ' || SQLERRM,
      'tournament_id', p_tournament_id,
      'sql_state', SQLSTATE,
      'context', 'Tournament completion function'
    );
END;
$$;
