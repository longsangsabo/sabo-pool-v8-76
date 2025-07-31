-- Fix Double Elimination Bracket với round numbering đúng chuẩn
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
  i INTEGER;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Get confirmed participants
  SELECT ARRAY_AGG(tr.user_id ORDER BY tr.created_at)
  INTO v_participant_ids
  FROM tournament_registrations tr
  WHERE tr.tournament_id = p_tournament_id
    AND tr.registration_status = 'confirmed';
  
  v_participant_count := array_length(v_participant_ids, 1);
  
  IF v_participant_count IS NULL OR v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Not enough participants');
  END IF;
  
  IF v_participant_count NOT IN (4, 8, 16) THEN
    RETURN jsonb_build_object('error', 'Participant count must be 4, 8, or 16 for double elimination');
  END IF;
  
  -- 🏆 WINNER'S BRACKET (Rounds 1-3)
  RAISE NOTICE 'Creating Winner Bracket for % participants', v_participant_count;
  
  -- WB Round 1: 16→8 (8 matches)
  FOR i IN 1..(v_participant_count / 2) LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      status, player1_id, player2_id, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i, 'winner',
      'scheduled', v_participant_ids[i * 2 - 1], v_participant_ids[i * 2], NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- WB Round 2: 8→4 (4 matches)
  FOR i IN 1..(v_participant_count / 4) LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i, 'winner',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- WB Round 3: 4→2 (2 matches)
  FOR i IN 1..(v_participant_count / 8) LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i, 'winner',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- 🔽 LOSER'S BRACKET - Branch A (LB Rounds 1-3)
  RAISE NOTICE 'Creating Loser Bracket Branch A';
  
  -- LB Branch A Round 1: 8→4 (4 matches)
  FOR i IN 1..(v_participant_count / 4) LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i, 'loser', 'branch_a',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- LB Branch A Round 2: 4→2 (2 matches)  
  FOR i IN 1..(v_participant_count / 8) LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i, 'loser', 'branch_a',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- LB Branch A Round 3: 2→1 (1 match)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, branch_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 3, 1, 'loser', 'branch_a',
    'pending', NOW(), NOW()
  );
  v_matches_created := v_matches_created + 1;
  
  -- 🔽 LOSER'S BRACKET - Branch B (LB Rounds 1-2)
  RAISE NOTICE 'Creating Loser Bracket Branch B';
  
  -- LB Branch B Round 1: 4→2 (2 matches)
  FOR i IN 1..(v_participant_count / 8) LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i, 'loser', 'branch_b',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- LB Branch B Round 2: 2→1 (1 match)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, branch_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 2, 1, 'loser', 'branch_b',
    'pending', NOW(), NOW()
  );
  v_matches_created := v_matches_created + 1;
  
  -- 🏁 FINAL STAGE
  RAISE NOTICE 'Creating Final Stage';
  
  -- Semifinals: 4→2 (2 matches)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 4, i, 'semifinal',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Grand Final: 2→1 (1 match)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 5, 1, 'final',
    'pending', NOW(), NOW()
  );
  v_matches_created := v_matches_created + 1;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'matches_created', v_matches_created,
    'structure', jsonb_build_object(
      'winner_rounds', 3,
      'loser_branch_a_rounds', 3, 
      'loser_branch_b_rounds', 2,
      'semifinal_round', 1,
      'final_round', 1
    ),
    'message', 'Double elimination bracket created with correct round numbering'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to create double elimination bracket: ' || SQLERRM
    );
END;
$$;