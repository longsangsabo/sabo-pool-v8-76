CREATE OR REPLACE FUNCTION public.force_close_tournament_registration(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rows_affected INTEGER;
  v_tournament RECORD;
BEGIN
  -- Check if tournament exists and get current status
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tournament not found'
    );
  END IF;
  
  -- Log current status
  RAISE NOTICE 'Tournament % current status: %', p_tournament_id, v_tournament.status;
  
  -- Update tournament status directly
  UPDATE tournaments 
  SET 
    status = 'registration_closed',
    updated_at = NOW()
  WHERE id = p_tournament_id;
  
  -- Check how many rows were affected
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  RAISE NOTICE 'Rows affected: %', v_rows_affected;
  
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
    RAISE NOTICE 'Error in force_close_tournament_registration: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sql_state', SQLSTATE
    );
END;
$function$;