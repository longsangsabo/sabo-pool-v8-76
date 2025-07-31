-- Fix the generate_modified_double_elimination function by removing has_bracket reference
CREATE OR REPLACE FUNCTION public.generate_modified_double_elimination(
  p_tournament_id uuid, 
  p_participants uuid[]
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_participant_count INTEGER;
  v_match_number INTEGER;
  i INTEGER;
  v_bracket_data JSONB;
BEGIN
  v_participant_count := array_length(p_participants, 1);
  
  -- Ensure exactly 16 participants
  IF v_participant_count != 16 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Modified double elimination requires exactly 16 participants');
  END IF;
  
  -- Clear existing matches
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Generate Winner Bracket - Round 1 (8 matches)
  FOR i IN 1..8 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i,
      p_participants[(i-1)*2+1], p_participants[(i-1)*2+2],
      'scheduled', 'winner', NULL,
      now(), now()
    );
  END LOOP;
  
  -- Generate Winner Bracket - Round 2 (4 matches)
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i,
      NULL, NULL, 'pending', 'winner', NULL,
      now(), now()
    );
  END LOOP;
  
  -- Generate Winner Bracket - Round 3 (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i,
      NULL, NULL, 'pending', 'winner', NULL,
      now(), now()
    );
  END LOOP;
  
  -- Generate Loser Bracket - Branch A Round 1 (4 matches) - Using round 4
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 4, i,
      NULL, NULL, 'pending', 'loser', 'branch_a',
      now(), now()
    );
  END LOOP;
  
  -- Generate Loser Bracket - Branch A Round 2 (2 matches) - Using round 5
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 5, i,
      NULL, NULL, 'pending', 'loser', 'branch_a',
      now(), now()
    );
  END LOOP;
  
  -- Generate Loser Bracket - Branch A Round 3 (1 match) - Using round 6
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type, branch_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 6, 1,
    NULL, NULL, 'pending', 'loser', 'branch_a',
    now(), now()
  );
  
  -- Generate Loser Bracket - Branch B Round 1 (2 matches) - Using round 7
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 7, i,
      NULL, NULL, 'pending', 'loser', 'branch_b',
      now(), now()
    );
  END LOOP;
  
  -- Generate Loser Bracket - Branch B Round 2 (1 match) - Using round 8  
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type, branch_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 8, 1,
    NULL, NULL, 'pending', 'loser', 'branch_b',
    now(), now()
  );
  
  -- Update tournament status (without has_bracket)
  UPDATE public.tournaments
  SET status = 'in_progress',
      updated_at = now()
  WHERE id = p_tournament_id;
  
  -- Create bracket data
  v_bracket_data := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'type', 'modified_double_elimination',
    'participants_count', v_participant_count,
    'winner_bracket_rounds', 3,
    'loser_bracket_rounds', 5,
    'generated_at', now()
  );
  
  -- Store bracket in tournament_brackets table
  INSERT INTO public.tournament_brackets (tournament_id, bracket_data, created_at)
  VALUES (p_tournament_id, v_bracket_data, now())
  ON CONFLICT (tournament_id) 
  DO UPDATE SET 
    bracket_data = EXCLUDED.bracket_data,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'bracket_type', 'modified_double_elimination',
    'total_matches', (
      SELECT COUNT(*) FROM public.tournament_matches 
      WHERE tournament_id = p_tournament_id
    ),
    'message', 'Modified double elimination bracket generated successfully'
  );
END;
$$;

-- Now generate the bracket
SELECT public.generate_modified_double_elimination('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', (SELECT array_agg(user_id) FROM tournament_registrations WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07' AND registration_status = 'confirmed' LIMIT 16));