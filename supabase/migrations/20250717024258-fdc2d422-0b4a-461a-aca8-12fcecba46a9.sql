-- Function to create new Double Elimination bracket structure
CREATE OR REPLACE FUNCTION create_double_elimination_bracket_v2(
  p_tournament_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_participants UUID[];
  v_participant_count INTEGER;
  match_id UUID;
BEGIN
  -- Get confirmed participants
  SELECT ARRAY_AGG(user_id), COUNT(*) 
  INTO v_participants, v_participant_count
  FROM public.tournament_registrations
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed'
  ORDER BY created_at;
  
  IF v_participant_count != 16 THEN
    RETURN jsonb_build_object('error', 'Tournament must have exactly 16 participants');
  END IF;
  
  -- Clear existing matches
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- PHASE 1: Create Winner Bracket (16→8→4→2)
  
  -- Winner Bracket Round 1: 8 matches (16→8)
  FOR i IN 1..8 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, bracket_type, round_number, match_number,
      player1_id, player2_id, status, scheduled_time, created_at, updated_at
    ) VALUES (
      p_tournament_id, 'winner', 1, i,
      v_participants[i*2-1], v_participants[i*2], 'scheduled',
      (SELECT tournament_start FROM public.tournaments WHERE id = p_tournament_id),
      now(), now()
    );
  END LOOP;
  
  -- Winner Bracket Round 2: 4 matches (8→4) - empty initially
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, bracket_type, round_number, match_number,
      player1_id, player2_id, status, scheduled_time, created_at, updated_at
    ) VALUES (
      p_tournament_id, 'winner', 2, i,
      NULL, NULL, 'pending',
      (SELECT tournament_start FROM public.tournaments WHERE id = p_tournament_id),
      now(), now()
    );
  END LOOP;
  
  -- Winner Bracket Round 3: 2 matches (4→2) - empty initially  
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, bracket_type, round_number, match_number,
      player1_id, player2_id, status, scheduled_time, created_at, updated_at
    ) VALUES (
      p_tournament_id, 'winner', 3, i,
      NULL, NULL, 'pending',
      (SELECT tournament_start FROM public.tournaments WHERE id = p_tournament_id),
      now(), now()
    );
  END LOOP;
  
  -- PHASE 2: Create Loser Branch A structure (8→4→2→1)
  
  -- Branch A Round 1: 4 matches (8→4) - empty initially (filled from WB R1 losers)
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, bracket_type, branch_type, round_number, match_number,
      player1_id, player2_id, status, scheduled_time, created_at, updated_at
    ) VALUES (
      p_tournament_id, 'loser', 'branch_a', 1, i,
      NULL, NULL, 'pending',
      (SELECT tournament_start FROM public.tournaments WHERE id = p_tournament_id),
      now(), now()
    );
  END LOOP;
  
  -- Branch A Round 2: 2 matches (4→2) - empty initially
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, bracket_type, branch_type, round_number, match_number,
      player1_id, player2_id, status, scheduled_time, created_at, updated_at
    ) VALUES (
      p_tournament_id, 'loser', 'branch_a', 2, i,
      NULL, NULL, 'pending',
      (SELECT tournament_start FROM public.tournaments WHERE id = p_tournament_id),
      now(), now()
    );
  END LOOP;
  
  -- Branch A Round 3: 1 match (2→1) - empty initially
  INSERT INTO public.tournament_matches (
    tournament_id, bracket_type, branch_type, round_number, match_number,
    player1_id, player2_id, status, scheduled_time, created_at, updated_at
  ) VALUES (
    p_tournament_id, 'loser', 'branch_a', 3, 1,
    NULL, NULL, 'pending',
    (SELECT tournament_start FROM public.tournaments WHERE id = p_tournament_id),
    now(), now()
  );
  
  -- PHASE 2: Create Loser Branch B structure (4→2→1)
  
  -- Branch B Round 1: 2 matches (4→2) - empty initially (filled from WB R2 losers)
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, bracket_type, branch_type, round_number, match_number,
      player1_id, player2_id, status, scheduled_time, created_at, updated_at
    ) VALUES (
      p_tournament_id, 'loser', 'branch_b', 1, i,
      NULL, NULL, 'pending',
      (SELECT tournament_start FROM public.tournaments WHERE id = p_tournament_id),
      now(), now()
    );
  END LOOP;
  
  -- Branch B Round 2: 1 match (2→1) - empty initially
  INSERT INTO public.tournament_matches (
    tournament_id, bracket_type, branch_type, round_number, match_number,
    player1_id, player2_id, status, scheduled_time, created_at, updated_at
  ) VALUES (
    p_tournament_id, 'loser', 'branch_b', 2, 1,
    NULL, NULL, 'pending',
    (SELECT tournament_start FROM public.tournaments WHERE id = p_tournament_id),
    now(), now()
  );
  
  -- Note: Semifinals and Final will be created dynamically when all 4 participants are ready
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Double Elimination bracket v2 created',
    'structure', jsonb_build_object(
      'winner_bracket_matches', 14,  -- 8+4+2
      'loser_branch_a_matches', 7,   -- 4+2+1  
      'loser_branch_b_matches', 3,   -- 2+1
      'semifinals_final_matches', 3, -- 2 semifinals + 1 final (created later)
      'total_matches', 27
    )
  );
END;
$$;