
-- Create function to force start a tournament
CREATE OR REPLACE FUNCTION public.force_start_tournament(
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
      'error', 'Insufficient permissions. Only admins or club owners can force start tournaments.'
    );
  END IF;
  
  -- Check current status - only allow force start from specific statuses
  IF v_tournament.status NOT IN ('registration_closed', 'upcoming') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tournament cannot be force started from current status: ' || v_tournament.status
    );
  END IF;
  
  -- Update tournament status to 'ongoing' and adjust start time to now
  UPDATE public.tournaments
  SET 
    status = 'ongoing',
    tournament_start = NOW(),
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
    'force_start_tournament', 
    p_tournament_id, 
    true, 
    jsonb_build_object(
      'started_by', v_current_user_id,
      'old_status', v_tournament.status,
      'new_status', 'ongoing',
      'is_admin', v_is_admin,
      'is_club_owner', v_is_club_owner,
      'original_start_time', v_tournament.tournament_start,
      'new_start_time', NOW()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'old_status', v_tournament.status,
    'new_status', 'ongoing',
    'message', 'Tournament force started successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unexpected error: ' || SQLERRM
    );
END;
$$;
