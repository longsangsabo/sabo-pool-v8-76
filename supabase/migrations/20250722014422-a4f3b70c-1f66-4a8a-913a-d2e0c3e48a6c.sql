-- Create function to check if tournament bracket can be generated
CREATE OR REPLACE FUNCTION public.can_generate_bracket(p_tournament_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_tournament RECORD;
  v_participant_count INTEGER;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN false;
  END IF;
  
  -- Tournament must be in the right status
  IF v_tournament.status NOT IN ('registration_closed', 'upcoming', 'ongoing') THEN
    RETURN false;
  END IF;
  
  -- Count confirmed participants
  SELECT COUNT(*) INTO v_participant_count
  FROM public.tournament_registrations 
  WHERE tournament_id = p_tournament_id 
    AND registration_status IN ('confirmed', 'paid');
  
  -- Need at least 2 participants
  IF v_participant_count < 2 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$