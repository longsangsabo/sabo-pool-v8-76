-- Fix the advance_double_elimination_v9 function return type
CREATE OR REPLACE FUNCTION public.advance_double_elimination_v9(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Call the existing SABO advancement function (returns void)
  PERFORM public.advance_sabo_tournament_fixed(
    p_tournament_id => p_tournament_id,
    p_completed_match_id => null,
    p_winner_id => null
  );
  
  -- Return success status as jsonb
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'message', 'Tournament advancement completed'
  );
END;
$function$;