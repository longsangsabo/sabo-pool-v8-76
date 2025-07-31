-- Drop and recreate the function with proper authentication handling
DROP FUNCTION IF EXISTS public.force_close_tournament_registration(uuid);

CREATE OR REPLACE FUNCTION public.force_close_tournament_registration(
  p_tournament_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_current_user_id UUID;
  v_is_admin BOOLEAN := false;
  v_is_club_owner BOOLEAN := false;
  v_result JSONB;
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
      'error', 'Insufficient permissions. Only admins or club owners can close tournament registration.'
    );
  END IF;
  
  -- Check current status
  IF v_tournament.status NOT IN ('registration_open', 'upcoming') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tournament registration cannot be closed from current status: ' || v_tournament.status
    );
  END IF;
  
  -- Update tournament status to 'ongoing'
  UPDATE public.tournaments
  SET 
    status = 'ongoing',
    registration_end = LEAST(registration_end, NOW()),
    updated_at = NOW()
  WHERE id = p_tournament_id;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to update tournament status'
    );
  END IF;
  
  -- Log the action
  INSERT INTO public.automation_performance_log (
    automation_type, 
    tournament_id, 
    success, 
    metadata
  ) VALUES (
    'force_close_registration', 
    p_tournament_id, 
    true, 
    jsonb_build_object(
      'closed_by', v_current_user_id,
      'old_status', v_tournament.status,
      'new_status', 'ongoing',
      'is_admin', v_is_admin,
      'is_club_owner', v_is_club_owner
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'old_status', v_tournament.status,
    'new_status', 'ongoing',
    'message', 'Tournament registration closed and status updated to ongoing'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unexpected error: ' || SQLERRM
    );
END;
$$;