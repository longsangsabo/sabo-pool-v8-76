-- Fix the create_double_elimination_bracket_v2 function SQL error
-- The issue is with ORDER BY created_at in ARRAY_AGG without proper grouping

CREATE OR REPLACE FUNCTION public.create_double_elimination_bracket_v2(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_bracket_id UUID;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Check if tournament is double elimination
  IF v_tournament.tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament must be double elimination type');
  END IF;
  
  -- Get confirmed participants with proper ordering
  SELECT ARRAY_AGG(user_id ORDER BY created_at), COUNT(*) 
  INTO v_participants, v_participant_count
  FROM public.tournament_registrations
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed';
  
  -- Validate participant count
  IF v_participant_count != 16 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Double elimination requires exactly 16 participants. Current: %s', v_participant_count)
    );
  END IF;
  
  -- Clear existing matches
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Generate bracket structure for 16 players
  -- Winner Bracket Round 1 (8 matches, 16 players)
  FOR i IN 1..8 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i, 'winner',
      v_participants[i*2-1], v_participants[i*2], 'scheduled', now(), now()
    );
  END LOOP;
  
  -- Winner Bracket Round 2 (4 matches, placeholder for 8 winners)
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i, 'winner',
      NULL, NULL, 'pending', now(), now()
    );
  END LOOP;
  
  -- Winner Bracket Round 3 (2 matches, placeholder for 4 winners)
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i, 'winner',
      NULL, NULL, 'pending', now(), now()
    );
  END LOOP;
  
  -- Loser Bracket Round 1 (4 matches, for losers from WB Round 2)
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      branch_type, player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i, 'loser',
      'branch_a', NULL, NULL, 'pending', now(), now()
    );
  END LOOP;
  
  -- Loser Bracket Round 2 (4 matches, losers from WB Round 1 + 4 WB R1 losers)
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      branch_type, player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i, 'loser',
      'branch_b', NULL, NULL, 'pending', now(), now()
    );
  END LOOP;
  
  -- Store bracket metadata
  INSERT INTO public.tournament_brackets (
    tournament_id, bracket_data, created_at
  ) VALUES (
    p_tournament_id,
    jsonb_build_object(
      'type', 'double_elimination_v2',
      'participants_count', 16,
      'structure', 'modified_double_elimination',
      'total_rounds', jsonb_build_object(
        'winner_bracket', 3,
        'loser_bracket', 2,
        'semifinal', 1,
        'final', 1
      )
    ),
    now()
  ) RETURNING id INTO v_bracket_id;
  
  -- Update tournament status
  UPDATE public.tournaments
  SET 
    status = 'in_progress',
    has_bracket = true,
    updated_at = now()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bracket_id', v_bracket_id,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'total_matches', (
      SELECT COUNT(*) FROM public.tournament_matches 
      WHERE tournament_id = p_tournament_id
    ),
    'message', 'Double elimination bracket v2 created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to create bracket: ' || SQLERRM
    );
END;
$$;