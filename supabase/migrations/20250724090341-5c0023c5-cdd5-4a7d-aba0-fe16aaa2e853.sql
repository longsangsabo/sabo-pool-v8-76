-- Fix the double elimination bracket creation logic
CREATE OR REPLACE FUNCTION public.create_double_elimination_bracket_simplified_fixed(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_participants uuid[];
  v_participant_count integer;
  v_winners_matches_count integer;
  v_losers_a_matches_count integer;
  v_losers_b_matches_count integer;
  v_match_counter integer := 1;
  v_result jsonb;
BEGIN
  -- Get confirmed participants
  SELECT array_agg(user_id ORDER BY COALESCE(priority_order, 999), created_at)
  INTO v_participants
  FROM tournament_registrations
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed';
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count IS NULL OR v_participant_count < 4 THEN
    RETURN jsonb_build_object('error', 'Need at least 4 participants for double elimination');
  END IF;

  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Calculate match counts for 16-player double elimination
  v_winners_matches_count := 8; -- Round 1: 8 matches (16→8)
  v_losers_a_matches_count := 4; -- Round 1: 4 matches (8 losers from WB R1)
  v_losers_b_matches_count := 2; -- Round 1: 2 matches (4 losers from WB R2)

  -- 1. CREATE WINNERS BRACKET (3 rounds: 16→8→4→2)
  
  -- Winners Round 1: 8 matches (16 players → 8 winners)
  FOR i IN 1..v_winners_matches_count LOOP
    INSERT INTO tournament_matches (
      tournament_id, bracket_type, round_number, match_number,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 'winners', 1, i,
      v_participants[i*2-1], -- Player 1
      v_participants[i*2],   -- Player 2
      'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- Winners Round 2: 4 matches (8 → 4)
  FOR i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      tournament_id, bracket_type, round_number, match_number,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 'winners', 2, i,
      NULL, NULL, 'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- Winners Round 3: 2 matches (4 → 2) 
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, bracket_type, round_number, match_number,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 'winners', 3, i,
      NULL, NULL, 'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- 2. CREATE LOSERS BRANCH A (3 rounds: 8→4→2→1)
  
  -- Losers Branch A Round 1: 4 matches 
  -- Will receive 8 losers from Winners R1 → pair them into 4 matches
  FOR i IN 1..v_losers_a_matches_count LOOP
    INSERT INTO tournament_matches (
      tournament_id, bracket_type, round_number, match_number,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 'losers_branch_a', 1, i,
      NULL, NULL, 'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- Losers Branch A Round 2: 2 matches (4 → 2)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, bracket_type, round_number, match_number,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 'losers_branch_a', 2, i,
      NULL, NULL, 'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- Losers Branch A Round 3: 1 match (2 → 1)
  INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 'losers_branch_a', 3, 1,
    NULL, NULL, 'scheduled', NOW(), NOW()
  );

  -- 3. CREATE LOSERS BRANCH B (2 rounds: 4→2→1)
  
  -- Losers Branch B Round 1: 2 matches
  -- Will receive 4 losers from Winners R2 → pair them into 2 matches  
  FOR i IN 1..v_losers_b_matches_count LOOP
    INSERT INTO tournament_matches (
      tournament_id, bracket_type, round_number, match_number,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 'losers_branch_b', 1, i,
      NULL, NULL, 'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- Losers Branch B Round 2: 1 match (2 → 1)
  INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 'losers_branch_b', 2, 1,
    NULL, NULL, 'scheduled', NOW(), NOW()
  );

  -- 4. CREATE SEMIFINALS (1 round: 4→2)
  -- 4 finalists: 2 from Winners + 1 from Losers A + 1 from Losers B
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, bracket_type, round_number, match_number,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 'semifinal', 1, i,
      NULL, NULL, 'scheduled', NOW(), NOW()
    );
  END LOOP;

  -- 5. CREATE FINAL (1 round: 2→1)
  INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 'final', 1, 1,
    NULL, NULL, 'scheduled', NOW(), NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participants', v_participant_count,
    'total_matches', 27, -- 15 + 7 + 3 + 2 = 27 matches
    'winners_matches', 15,
    'losers_a_matches', 7,
    'losers_b_matches', 3,
    'semifinal_matches', 2,
    'final_matches', 1
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;