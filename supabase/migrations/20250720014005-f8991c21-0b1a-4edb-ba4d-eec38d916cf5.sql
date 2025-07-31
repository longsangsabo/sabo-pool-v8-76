-- Grant necessary permissions for the function to work
GRANT SELECT, UPDATE ON tournaments TO postgres;

-- Recreate function with proper security context
CREATE OR REPLACE FUNCTION public.force_close_tournament_registration(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rows_affected INTEGER;
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
  
  -- Check if tournament exists and get current status
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tournament not found'
    );
  END IF;
  
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = v_current_user_id AND is_admin = true
  ) INTO v_is_admin;
  
  -- Check if user is club owner of the tournament
  SELECT EXISTS (
    SELECT 1 FROM club_profiles cp
    WHERE cp.id = v_tournament.club_id AND cp.user_id = v_current_user_id
  ) INTO v_is_club_owner;
  
  -- Verify permissions
  IF NOT (v_is_admin OR v_is_club_owner) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins or club owners can close tournament registration'
    );
  END IF;
  
  -- Update tournament status with bypass of RLS
  UPDATE tournaments 
  SET 
    status = 'registration_closed',
    updated_at = NOW()
  WHERE id = p_tournament_id;
  
  -- Check how many rows were affected
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  IF v_rows_affected = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to update tournament status - no rows affected'
    );
  END IF;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'message', 'Tournament registration closed successfully',
    'rows_affected', v_rows_affected,
    'previous_status', v_tournament.status,
    'new_status', 'registration_closed'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sql_state', SQLSTATE
    );
END;
$function$;