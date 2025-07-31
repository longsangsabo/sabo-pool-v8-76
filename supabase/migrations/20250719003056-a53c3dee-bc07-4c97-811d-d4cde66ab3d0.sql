-- Function to manually close tournament registration
CREATE OR REPLACE FUNCTION public.force_close_tournament_registration(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update tournament status directly
  UPDATE tournaments 
  SET 
    status = 'registration_closed',
    updated_at = NOW()
  WHERE id = p_tournament_id;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'message', 'Tournament registration closed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;