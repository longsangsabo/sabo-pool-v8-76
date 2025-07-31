-- Create the missing generate_modified_double_elimination function for 16-player double elimination
CREATE OR REPLACE FUNCTION public.generate_modified_double_elimination(
  p_tournament_id UUID,
  p_participants UUID[]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_participant_count INTEGER;
  v_bracket_data JSONB;
  i INTEGER;
BEGIN
  v_participant_count := array_length(p_participants, 1);
  
  -- Validate exactly 16 participants
  IF v_participant_count != 16 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Modified double elimination requires exactly 16 participants');
  END IF;
  
  -- Clear existing matches
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- WINNER BRACKET: 16→8→4→2→1 (4 rounds)
  -- Round 1: 16 players → 8 winners (8 matches)
  FOR i IN 1..8 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i, 'winner',
      p_participants[(i-1)*2+1], p_participants[(i-1)*2+2], 'scheduled',
      now(), now()
    );
  END LOOP;
  
  -- Winner Bracket Round 2: 8→4 (4 matches)
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i, 'winner',
      NULL, NULL, 'pending',
      now(), now()
    );
  END LOOP;
  
  -- Winner Bracket Round 3 (Semifinals): 4→2 (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i, 'winner',
      NULL, NULL, 'pending',
      now(), now()
    );
  END LOOP;
  
  -- Winner Bracket Final: 2→1 (1 match)
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    player1_id, player2_id, status,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 4, 1, 'winner',
    NULL, NULL, 'pending',
    now(), now()
  );
  
  -- LOSER BRACKET: Complex structure
  -- LB Round 1: 8 losers from WB R1 → 4 survivors (4 matches)
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i, 'loser',
      NULL, NULL, 'pending',
      now(), now()
    );
  END LOOP;
  
  -- LB Round 2: 4 LB survivors + 4 losers from WB R2 → 4 players (4 matches)
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i, 'loser',
      NULL, NULL, 'pending',
      now(), now()
    );
  END LOOP;
  
  -- LB Round 3: 4 players → 2 players (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i, 'loser',
      NULL, NULL, 'pending',
      now(), now()
    );
  END LOOP;
  
  -- LB Round 4: 2 players + 2 losers from WB Semi → 2 players (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 4, i, 'loser',
      NULL, NULL, 'pending',
      now(), now()
    );
  END LOOP;
  
  -- LB Final: 2 players → 1 LB champion (1 match)
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    player1_id, player2_id, status,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 5, 1, 'loser',
    NULL, NULL, 'pending',
    now(), now()
  );
  
  -- GRAND FINAL: WB Winner vs LB Winner (1 match)
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    player1_id, player2_id, status,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 1, 1, 'single_elimination',
    NULL, NULL, 'pending',
    now(), now()
  );
  
  -- Update tournament status
  UPDATE public.tournaments
  SET status = 'in_progress',
      has_bracket = true,
      updated_at = now()
  WHERE id = p_tournament_id;
  
  -- Create bracket data
  v_bracket_data := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'type', 'modified_double_elimination',
    'participants_count', v_participant_count,
    'winner_rounds', 4,
    'loser_rounds', 5,
    'grand_final_rounds', 1,
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
    'winner_matches', (
      SELECT COUNT(*) FROM public.tournament_matches 
      WHERE tournament_id = p_tournament_id AND bracket_type = 'winner'
    ),
    'loser_matches', (
      SELECT COUNT(*) FROM public.tournament_matches 
      WHERE tournament_id = p_tournament_id AND bracket_type = 'loser'
    ),
    'grand_final_matches', (
      SELECT COUNT(*) FROM public.tournament_matches 
      WHERE tournament_id = p_tournament_id AND bracket_type = 'single_elimination'
    ),
    'message', 'Modified double elimination bracket generated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to generate modified double elimination: ' || SQLERRM
    );
END;
$$;