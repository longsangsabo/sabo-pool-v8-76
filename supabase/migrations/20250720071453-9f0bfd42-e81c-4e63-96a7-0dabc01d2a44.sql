-- Create function for club owners to force complete their tournaments
CREATE OR REPLACE FUNCTION public.club_force_complete_tournament(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_current_user_id UUID;
  v_is_admin BOOLEAN := false;
  v_is_club_owner BOOLEAN := false;
  v_completion_result JSONB;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  
  -- Allow function to work for authenticated users (we'll check permissions below)
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
      'error', 'Insufficient permissions. Only admins or club owners can complete tournaments.'
    );
  END IF;
  
  -- Check if tournament can be completed
  IF v_tournament.status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Tournament is already completed',
      'status', v_tournament.status
    );
  END IF;
  
  -- Try to complete the tournament normally first
  SELECT public.complete_tournament_automatically(p_tournament_id) INTO v_completion_result;
  
  IF v_completion_result->>'success' = 'true' THEN
    -- Log the successful completion
    INSERT INTO public.automation_performance_log (
      automation_type, 
      tournament_id, 
      success, 
      metadata
    ) VALUES (
      'club_force_complete_tournament', 
      p_tournament_id, 
      true, 
      jsonb_build_object(
        'completed_by', v_current_user_id,
        'old_status', v_tournament.status,
        'new_status', 'completed',
        'is_admin', v_is_admin,
        'is_club_owner', v_is_club_owner,
        'completion_method', 'automatic'
      )
    );
    
    RETURN v_completion_result;
  ELSE
    -- If automatic completion fails, force status update
    UPDATE public.tournaments
    SET 
      status = 'completed',
      completed_at = COALESCE(completed_at, NOW()),
      updated_at = NOW()
    WHERE id = p_tournament_id;
    
    -- Log the forced completion
    INSERT INTO public.automation_performance_log (
      automation_type, 
      tournament_id, 
      success, 
      metadata
    ) VALUES (
      'club_force_complete_tournament', 
      p_tournament_id, 
      true, 
      jsonb_build_object(
        'completed_by', v_current_user_id,
        'old_status', v_tournament.status,
        'new_status', 'completed',
        'is_admin', v_is_admin,
        'is_club_owner', v_is_club_owner,
        'completion_method', 'forced_status_only',
        'automatic_completion_error', v_completion_result->>'error'
      )
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'tournament_id', p_tournament_id,
      'tournament_name', v_tournament.name,
      'old_status', v_tournament.status,
      'new_status', 'completed',
      'message', 'Tournament status updated to completed (forced completion)',
      'warning', 'Results may need manual calculation due to automatic completion failure'
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unexpected error: ' || SQLERRM
    );
END;
$function$;