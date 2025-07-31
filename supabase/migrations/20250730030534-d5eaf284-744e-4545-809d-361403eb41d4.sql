-- Fix the advance_double_elimination_v9 function to call the correct existing function
CREATE OR REPLACE FUNCTION public.advance_double_elimination_v9(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use the existing SABO advancement function instead of the non-existent v9_fixed
  RETURN public.advance_sabo_tournament_fixed(
    p_tournament_id => p_tournament_id,
    p_completed_match_id => null,
    p_winner_id => null
  );
END;
$function$;