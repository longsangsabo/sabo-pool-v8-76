-- Fix double elimination bracket generation to use proper structure for 16 players
CREATE OR REPLACE FUNCTION public.create_double_elimination_bracket_v2(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participant_ids UUID[];
  v_participant_count INTEGER;
  v_matches_created INTEGER := 0;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Get confirmed participants ordered by registration time
  SELECT ARRAY_AGG(tr.user_id ORDER BY tr.created_at)
  INTO v_participant_ids
  FROM tournament_registrations tr
  WHERE tr.tournament_id = p_tournament_id
    AND tr.registration_status = 'confirmed';
  
  v_participant_count := array_length(v_participant_ids, 1);
  
  -- Ensure exactly 16 participants for modified double elimination
  IF v_participant_count != 16 THEN
    RETURN jsonb_build_object('error', 'Modified double elimination requires exactly 16 participants. Current: ' || COALESCE(v_participant_count, 0));
  END IF;
  
  -- 1. Generate Winner Bracket - Round 1 (8 matches)
  FOR i IN 1..8 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i,
      v_participant_ids[(i-1)*2+1], v_participant_ids[(i-1)*2+2],
      'scheduled', 'winner',
      now(), now()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- 2. Generate Winner Bracket - Round 2 (4 matches)
  FOR i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i,
      NULL, NULL, 'pending', 'winner',
      now(), now()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- 3. Generate Winner Bracket - Round 3 (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i,
      NULL, NULL, 'pending', 'winner',
      now(), now()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- 4. Generate Winner Bracket - Round 4 (1 match - Winner Final)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 4, 1,
    NULL, NULL, 'pending', 'winner',
    now(), now()
  );
  v_matches_created := v_matches_created + 1;
  
  -- 5. Generate Loser Bracket - Round 1 (4 matches) - Branch A
  FOR i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i,
      NULL, NULL, 'pending', 'loser', 'branch_a',
      now(), now()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- 6. Generate Loser Bracket - Round 2 (2 matches) - Branch A
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i,
      NULL, NULL, 'pending', 'loser', 'branch_a',
      now(), now()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- 7. Generate Loser Bracket - Round 3 (2 matches) - Branch B
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      player1_id, player2_id, status, bracket_type, branch_type,
      created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i,
      NULL, NULL, 'pending', 'loser', 'branch_b',
      now(), now()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- 8. Generate Loser Bracket - Round 4 (1 match) - Branch B
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type, branch_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 4, 1,
    NULL, NULL, 'pending', 'loser', 'branch_b',
    now(), now()
  );
  v_matches_created := v_matches_created + 1;
  
  -- 9. Generate Loser Bracket - Round 5 (1 match - Loser Final) - Branch B
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type, branch_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 5, 1,
    NULL, NULL, 'pending', 'loser', 'branch_b',
    now(), now()
  );
  v_matches_created := v_matches_created + 1;
  
  -- 10. Generate Grand Final (1 match)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type,
    created_at, updated_at
  ) VALUES (
    p_tournament_id, 1, 1,
    NULL, NULL, 'pending', 'grand_final',
    now(), now()
  );
  v_matches_created := v_matches_created + 1;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'matches_created', v_matches_created,
    'winner_rounds', 4,
    'loser_rounds', 5,
    'structure', 'modified_double_elimination_16_players',
    'message', 'Modified double elimination bracket created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to create double elimination bracket: ' || SQLERRM
    );
END;
$$;

-- Test regenerate bracket cho tournament sabo12
SELECT public.route_bracket_generation('baaadc65-8a64-4d82-aa95-5a8db8662daa'::uuid);