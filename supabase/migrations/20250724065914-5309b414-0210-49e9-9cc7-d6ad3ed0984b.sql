-- Create compatibility wrapper for old function name
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Just call the new comprehensive function
  RETURN public.advance_double_elimination_winner_comprehensive(p_match_id);
END;
$$;