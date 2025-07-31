-- Create the can_generate_bracket function for tournament validation
CREATE OR REPLACE FUNCTION public.can_generate_bracket(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_tournament RECORD;
  v_participant_count INTEGER;
  v_bracket_exists BOOLEAN := false;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'Tournament not found'
    );
  END IF;
  
  -- Check tournament status - allow registration_open, registration_closed, and upcoming
  IF v_tournament.status NOT IN ('registration_open', 'registration_closed', 'upcoming') THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'Tournament must be in registration_open, registration_closed, or upcoming status'
    );
  END IF;
  
  -- Count confirmed participants
  SELECT COUNT(*) INTO v_participant_count
  FROM public.tournament_registrations
  WHERE tournament_id = p_tournament_id
  AND registration_status = 'confirmed';
  
  -- Check minimum participants (at least 2)
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', format('Minimum 2 participants required. Current: %s', v_participant_count)
    );
  END IF;
  
  -- Check if bracket already exists
  SELECT EXISTS(
    SELECT 1 FROM public.tournament_brackets
    WHERE tournament_id = p_tournament_id
  ) INTO v_bracket_exists;
  
  RETURN jsonb_build_object(
    'valid', true,
    'participant_count', v_participant_count,
    'bracket_exists', v_bracket_exists,
    'tournament_type', v_tournament.tournament_type,
    'tournament_status', v_tournament.status
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'Validation error: ' || SQLERRM
    );
END;
$function$;