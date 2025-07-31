
-- Update create_double_elimination_bracket_v2 function to support generation_type parameter
CREATE OR REPLACE FUNCTION public.create_double_elimination_bracket_v2(
  p_tournament_id uuid,
  p_generation_type text DEFAULT 'random'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Get confirmed participants with proper ordering based on generation type
  IF p_generation_type = 'elo_based' THEN
    -- Order by ELO points descending for proper seeding
    SELECT ARRAY_AGG(tr.user_id ORDER BY COALESCE(pr.elo_points, 1000) DESC), COUNT(*) 
    INTO v_participants, v_participant_count
    FROM public.tournament_registrations tr
    LEFT JOIN public.player_rankings pr ON tr.user_id = pr.user_id
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed';
  ELSE
    -- Random ordering
    SELECT ARRAY_AGG(tr.user_id ORDER BY RANDOM()), COUNT(*) 
    INTO v_participants, v_participant_count
    FROM public.tournament_registrations tr
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed';
  END IF;
  
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
  
  -- Store bracket metadata with generation type
  INSERT INTO public.tournament_brackets (
    tournament_id, 
    total_rounds, 
    total_players, 
    bracket_type, 
    bracket_data, 
    created_at
  ) VALUES (
    p_tournament_id,
    8,
    16,
    'double_elimination',
    jsonb_build_object(
      'type', 'double_elimination_complete',
      'participants_count', 16,
      'structure', 'complete_double_elimination',
      'generation_type', p_generation_type,
      'phases', jsonb_build_object(
        'winner_bracket_rounds', 3,
        'loser_branch_a_rounds', 3,
        'loser_branch_b_rounds', 2,
        'semifinal_rounds', 1,
        'final_rounds', 1
      ),
      'total_matches_created', v_match_counter,
      'flow', 'WB(16→8→4→2) + LB-A(8→4→2→1) + LB-B(4→2→1) + SF(4→2) + F(2→1)'
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
    'total_matches', v_match_counter,
    'generation_type', p_generation_type,
    'structure', jsonb_build_object(
      'winner_bracket', '16→8→4→2 (3 rounds)',
      'loser_branch_a', '8→4→2→1 (3 rounds)',
      'loser_branch_b', '4→2→1 (2 rounds)', 
      'semifinals', '4→2 (1 round)',
      'grand_finals', '2→1 (1 round)'
    ),
    'message', format('Complete Double Elimination bracket created successfully (%s)', p_generation_type)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to create bracket: ' || SQLERRM
    );
END;
$function$;

-- Update generate_single_elimination_bracket function to support generation_type parameter
CREATE OR REPLACE FUNCTION public.generate_single_elimination_bracket(
  p_tournament_id uuid,
  p_generation_type text DEFAULT 'random'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_rounds INTEGER;
  v_matches_per_round INTEGER;
  v_current_round INTEGER := 1;
  v_match_number INTEGER;
  v_bracket_id UUID;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Get confirmed participants with proper ordering based on generation type
  IF p_generation_type = 'elo_based' THEN
    -- Order by ELO points descending for proper seeding
    SELECT ARRAY_AGG(tr.user_id ORDER BY COALESCE(pr.elo_points, 1000) DESC), COUNT(*) 
    INTO v_participants, v_participant_count
    FROM public.tournament_registrations tr
    LEFT JOIN public.player_rankings pr ON tr.user_id = pr.user_id
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed';
  ELSE
    -- Random ordering
    SELECT ARRAY_AGG(tr.user_id ORDER BY RANDOM()), COUNT(*) 
    INTO v_participants, v_participant_count
    FROM public.tournament_registrations tr
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed';
  END IF;
  
  -- Validate participant count
  IF v_participant_count < 4 OR v_participant_count NOT IN (4, 8, 16, 32) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Single elimination requires exactly 4, 8, 16, or 32 participants. Current: %s', v_participant_count)
    );
  END IF;
  
  -- Calculate number of rounds
  v_rounds := CEIL(LOG(2, v_participant_count));
  
  -- Clear existing matches
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Create first round matches
  v_matches_per_round := v_participant_count / 2;
  
  FOR i IN 1..v_matches_per_round LOOP
    INSERT INTO public.tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i, 'single',
      v_participants[i*2-1], v_participants[i*2], 'scheduled', now(), now()
    );
  END LOOP;
  
  -- Create remaining rounds with pending matches
  FOR round_num IN 2..v_rounds LOOP
    v_matches_per_round := v_matches_per_round / 2;
    
    FOR match_num IN 1..v_matches_per_round LOOP
      INSERT INTO public.tournament_matches (
        tournament_id, round_number, match_number, bracket_type,
        status, created_at, updated_at
      ) VALUES (
        p_tournament_id, round_num, match_num, 'single',
        'pending', now(), now()
      );
    END LOOP;
  END LOOP;
  
  -- Store bracket metadata
  INSERT INTO public.tournament_brackets (
    tournament_id, 
    total_rounds, 
    total_players, 
    bracket_type, 
    bracket_data, 
    created_at
  ) VALUES (
    p_tournament_id,
    v_rounds,
    v_participant_count,
    'single_elimination',
    jsonb_build_object(
      'type', 'single_elimination',
      'participants_count', v_participant_count,
      'total_rounds', v_rounds,
      'generation_type', p_generation_type
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
    'total_rounds', v_rounds,
    'generation_type', p_generation_type,
    'message', format('Single elimination bracket created successfully (%s)', p_generation_type)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to create bracket: ' || SQLERRM
    );
END;
$function$;
