-- Function to force update tournament status directly bypassing RLS
CREATE OR REPLACE FUNCTION public.admin_force_update_tournament_status(
  p_tournament_id uuid, 
  p_new_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Force update the tournament status
  UPDATE tournaments 
  SET 
    status = p_new_status,
    updated_at = NOW()
  WHERE id = p_tournament_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Return detailed response
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'new_status', p_new_status,
    'rows_updated', v_updated_count,
    'message', format('Tournament status updated to %s successfully (%s rows affected)', p_new_status, v_updated_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;