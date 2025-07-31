-- Create the missing repair_double_elimination_bracket function to fix TypeScript errors
CREATE OR REPLACE FUNCTION public.repair_double_elimination_bracket(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use the new fixed advance function as the main repair function
  RETURN public.advance_double_elimination_v9_fixed(p_tournament_id);
END;
$function$;