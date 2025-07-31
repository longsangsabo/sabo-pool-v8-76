-- Fix the create_double_elimination_bracket_v2 function to use correct bracket_type values
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
  v_match_counter INTEGER := 0;
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
  
  -- Validate participant count (must be exactly 16 for this implementation)
  IF v_participant_count != 16 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Double elimination requires exactly 16 participants. Current: %s', v_participant_count)
    );
  END IF;
  
  -- Clear existing matches
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- ========================================
  -- WINNER'S BRACKET: 16→8→4→2 (3 rounds)
  -- ========================================
  
  -- WB Round 1: 16→8 (8 matches)
  FOR i IN 1..8 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i, 'winner',
      v_participants[i*2-1], v_participants[i*2], 'scheduled', now(), now()
    );
    v_match_counter := v_match_counter + 1;
  END LOOP;
  
  -- WB Round 2: 8→4 (4 matches, pending players)
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i, 'winner',
      'pending', now(), now()
    );
    v_match_counter := v_match_counter + 1;
  END LOOP;
  
  -- WB Round 3: 4→2 (2 matches, pending players)
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i, 'winner',
      'pending', now(), now()
    );
    v_match_counter := v_match_counter + 1;
  END LOOP;
  
  -- ========================================
  -- LOSER'S BRACKET BRANCH A: 8→4→2→1 (3 rounds)
  -- For losers from WB Round 1
  -- ========================================
  
  -- LB Branch A Round 1: 8→4 (4 matches)
  FOR i IN 1..4 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i, 'loser', 'branch_a',
      'pending', now(), now()
    );
    v_match_counter := v_match_counter + 1;
  END LOOP;
  
  -- LB Branch A Round 2: 4→2 (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i, 'loser', 'branch_a',
      'pending', now(), now()
    );
    v_match_counter := v_match_counter + 1;
  END LOOP;
  
  -- LB Branch A Round 3: 2→1 (1 match)
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number, bracket_type, branch_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 3, 1, 'loser', 'branch_a',
    'pending', now(), now()
  );
  v_match_counter := v_match_counter + 1;
  
  -- ========================================
  -- LOSER'S BRACKET BRANCH B: 4→2→1 (2 rounds)  
  -- For losers from WB Round 2
  -- ========================================
  
  -- LB Branch B Round 1: 4→2 (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i, 'loser', 'branch_b',
      'pending', now(), now()
    );
    v_match_counter := v_match_counter + 1;
  END LOOP;
  
  -- LB Branch B Round 2: 2→1 (1 match)
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number, bracket_type, branch_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 2, 1, 'loser', 'branch_b',
    'pending', now(), now()
  );
  v_match_counter := v_match_counter + 1;
  
  -- ========================================
  -- SEMIFINALS: 4→2 (2 matches)
  -- 2 WB finalists + 2 LB winners
  -- ========================================
  
  -- Semifinal Match 1
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at, notes
  ) VALUES (
    p_tournament_id, 1, 1, 'semifinal',
    'pending', now(), now(), 'WB Finalist 1 vs LB Branch A Winner'
  );
  v_match_counter := v_match_counter + 1;
  
  -- Semifinal Match 2
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at, notes
  ) VALUES (
    p_tournament_id, 1, 2, 'semifinal',
    'pending', now(), now(), 'WB Finalist 2 vs LB Branch B Winner'
  );
  v_match_counter := v_match_counter + 1;
  
  -- ========================================
  -- GRAND FINALS: 2→1 (1 match, possibly 2 with reset)
  -- ========================================
  
  -- Grand Finals Match
  INSERT INTO public.tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at, notes
  ) VALUES (
    p_tournament_id, 1, 1, 'final',
    'pending', now(), now(), 'Grand Finals - Championship Match'
  );
  v_match_counter := v_match_counter + 1;
  
  -- Update tournament status
  UPDATE public.tournaments
  SET 
    status = 'ongoing',
    has_bracket = true,
    updated_at = now()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'total_matches', v_match_counter,
    'structure', jsonb_build_object(
      'winner_bracket', '16→8→4→2 (3 rounds)',
      'loser_branch_a', '8→4→2→1 (3 rounds)',
      'loser_branch_b', '4→2→1 (2 rounds)', 
      'semifinals', '4→2 (1 round)',
      'grand_finals', '2→1 (1 round)'
    ),
    'message', 'Complete Double Elimination bracket created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to create bracket: ' || SQLERRM
    );
END;
$$;