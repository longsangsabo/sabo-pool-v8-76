-- Create the missing function that some components might be calling
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This is a wrapper function that calls the comprehensive version
  RETURN public.advance_double_elimination_winner_comprehensive(p_match_id);
END;
$$;