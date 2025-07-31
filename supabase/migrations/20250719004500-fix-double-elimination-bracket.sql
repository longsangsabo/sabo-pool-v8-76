
-- Fix double elimination bracket generation function
CREATE OR REPLACE FUNCTION public.generate_complete_bracket(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_result JSONB;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Get confirmed participants
  SELECT ARRAY_AGG(user_id ORDER BY created_at), COUNT(*) 
  INTO v_participants, v_participant_count
  FROM public.tournament_registrations
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed';
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough participants');
  END IF;
  
  -- Route to appropriate bracket generation
  IF v_tournament.tournament_type = 'double_elimination' THEN
    IF v_participant_count = 16 THEN
      SELECT public.create_double_elimination_bracket_v2(p_tournament_id) INTO v_result;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Double elimination requires exactly 16 participants. Current: ' || v_participant_count);
    END IF;
  ELSE
    -- Single elimination fallback
    SELECT public.generate_single_elimination_bracket(p_tournament_id, v_participants) INTO v_result;
  END IF;
  
  -- Return result with additional metadata
  RETURN jsonb_build_object(
    'success', COALESCE(v_result->>'success', 'false')::boolean,
    'matches_created', (SELECT COUNT(*) FROM public.tournament_matches WHERE tournament_id = p_tournament_id),
    'rounds_created', (SELECT COUNT(DISTINCT round_number) FROM public.tournament_matches WHERE tournament_id = p_tournament_id),
    'has_third_place', false,
    'bracket_type', v_tournament.tournament_type,
    'participant_count', v_participant_count,
    'details', v_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to generate bracket: ' || SQLERRM
    );
END;
$$;

-- Create single elimination function for fallback
CREATE OR REPLACE FUNCTION public.generate_single_elimination_bracket(
  p_tournament_id UUID,
  p_participants UUID[]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_participant_count INTEGER;
  v_total_rounds INTEGER;
  v_round INTEGER;
  v_matches_in_round INTEGER;
  i INTEGER;
BEGIN
  v_participant_count := array_length(p_participants, 1);
  v_total_rounds := CEIL(LOG(2, v_participant_count));
  
  -- Clear existing matches
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Generate first round matches
  v_matches_in_round := CEIL(v_participant_count / 2.0);
  
  FOR i IN 1..v_matches_in_round LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, bracket_type, status,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i,
      CASE WHEN (i-1)*2+1 <= v_participant_count THEN p_participants[(i-1)*2+1] ELSE NULL END,
      CASE WHEN (i-1)*2+2 <= v_participant_count THEN p_participants[(i-1)*2+2] ELSE NULL END,
      'winner',
      CASE 
        WHEN (i-1)*2+2 > v_participant_count THEN 'bye'
        ELSE 'scheduled'
      END,
      now(), now()
    );
  END LOOP;
  
  -- Generate placeholder matches for subsequent rounds
  FOR v_round IN 2..v_total_rounds LOOP
    v_matches_in_round := CEIL(v_matches_in_round / 2.0);
    
    FOR i IN 1..v_matches_in_round LOOP
      INSERT INTO public.tournament_matches (
        tournament_id, round_number, match_number,
        bracket_type, status,
        created_at, updated_at
      ) VALUES (
        p_tournament_id, v_round, i,
        'winner', 'pending',
        now(), now()
      );
    END LOOP;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'bracket_type', 'single_elimination',
    'total_matches', (
      SELECT COUNT(*) FROM public.tournament_matches 
      WHERE tournament_id = p_tournament_id
    ),
    'message', 'Single elimination bracket generated successfully'
  );
END;
$$;
