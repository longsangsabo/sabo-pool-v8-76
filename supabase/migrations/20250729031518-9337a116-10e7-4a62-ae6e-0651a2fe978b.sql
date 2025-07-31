-- Update double elimination bracket generation to implement correct Loser's Branch A logic
-- 8 losers from Winners Round 1 → Branch A Round 1 (4 matches) → Branch A Round 2 (2 matches) → Branch A Round 3 (1 match) → 1 finalist

CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete_v4(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_participants UUID[];
  v_participant_count INTEGER;
  v_winners_round_matches INTEGER;
  v_match_number INTEGER := 1;
  v_current_round INTEGER;
  v_temp_participants UUID[];
  v_i INTEGER;
  v_j INTEGER;
BEGIN
  -- Get confirmed participants
  SELECT array_agg(user_id ORDER BY priority_order, created_at)
  INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed';
  
  IF v_participants IS NULL OR array_length(v_participants, 1) < 4 THEN
    RETURN jsonb_build_object('error', 'Need at least 4 participants');
  END IF;
  
  v_participant_count := array_length(v_participants, 1);
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Generate Winners Bracket
  v_temp_participants := v_participants;
  v_current_round := 1;
  
  WHILE array_length(v_temp_participants, 1) > 1 LOOP
    DECLARE
      v_new_participants UUID[] := '{}';
      v_match_count INTEGER := array_length(v_temp_participants, 1) / 2;
    BEGIN
      FOR v_i IN 1..v_match_count LOOP
        INSERT INTO tournament_matches (
          tournament_id, round_number, match_number, 
          player1_id, player2_id, status, bracket_type, match_stage
        ) VALUES (
          p_tournament_id, v_current_round, v_i,
          v_temp_participants[v_i * 2 - 1], v_temp_participants[v_i * 2],
          'waiting', 'winners', 'winners_round_' || v_current_round
        );
        
        -- For bracket generation, assume player1 wins (will be updated in real matches)
        v_new_participants := v_new_participants || v_temp_participants[v_i * 2 - 1];
      END LOOP;
      
      v_temp_participants := v_new_participants;
      v_current_round := v_current_round + 1;
    END;
  END LOOP;
  
  -- Generate Loser's Branch A (for losers from Winners Round 1)
  -- 8 participants → 3 rounds (A1: 4 matches, A2: 2 matches, A3: 1 match)
  DECLARE
    v_losers_round_1_count INTEGER := (v_participant_count / 2); -- 8 losers from first round
    v_branch_a_participants INTEGER := v_losers_round_1_count;
  BEGIN
    -- Branch A Round 1: 8 players → 4 matches → 4 winners
    IF v_branch_a_participants >= 4 THEN
      FOR v_i IN 1..(v_branch_a_participants / 2) LOOP
        INSERT INTO tournament_matches (
          tournament_id, round_number, match_number,
          player1_id, player2_id, status, bracket_type, 
          match_stage, branch_type, loser_branch
        ) VALUES (
          p_tournament_id, 101, v_i,
          NULL, NULL, 'waiting', 'losers',
          'losers_branch_a_round_1', 'Branch A', 'A'
        );
      END LOOP;
      
      -- Branch A Round 2: 4 players → 2 matches → 2 winners  
      FOR v_i IN 1..2 LOOP
        INSERT INTO tournament_matches (
          tournament_id, round_number, match_number,
          player1_id, player2_id, status, bracket_type,
          match_stage, branch_type, loser_branch
        ) VALUES (
          p_tournament_id, 102, v_i,
          NULL, NULL, 'waiting', 'losers',
          'losers_branch_a_round_2', 'Branch A', 'A'
        );
      END LOOP;
      
      -- Branch A Round 3: 2 players → 1 match → 1 finalist
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number,
        player1_id, player2_id, status, bracket_type,
        match_stage, branch_type, loser_branch
      ) VALUES (
        p_tournament_id, 103, 1,
        NULL, NULL, 'waiting', 'losers',
        'losers_branch_a_round_3', 'Branch A', 'A'
      );
    END IF;
  END;
  
  -- Generate Loser's Branch B (for losers from Winners Round 2 and later)
  -- This will be dynamically created as needed
  
  -- Create Grand Final
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type, match_stage
  ) VALUES (
    p_tournament_id, 200, 1,
    NULL, NULL, 'waiting', 'final', 'grand_final'
  );
  
  -- Log bracket creation
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    p_tournament_id, 'bracket_generation', 'completed',
    jsonb_build_object(
      'version', 'v4',
      'participants', v_participant_count,
      'winners_rounds', v_current_round - 1,
      'branch_a_structure', '8→4→2→1',
      'logic', 'Fixed Branch A progression'
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'participants', v_participant_count,
    'winners_rounds', v_current_round - 1,
    'branch_a_rounds', 3,
    'total_matches', (
      SELECT COUNT(*) FROM tournament_matches 
      WHERE tournament_id = p_tournament_id
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', 'Failed to generate bracket v4'
    );
END;
$$;

-- Update advancement function to handle Branch A progression correctly
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner_comprehensive_v4(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_match RECORD;
  v_result JSONB;
BEGIN
  -- Get match details
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id AND status = 'completed' AND winner_id IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not completed or no winner');
  END IF;
  
  v_winner_id := v_match.winner_id;
  v_loser_id := CASE 
    WHEN v_match.player1_id = v_winner_id THEN v_match.player2_id 
    ELSE v_match.player1_id 
  END;
  
  -- Handle Winners Bracket advancement
  IF v_match.bracket_type = 'winners' THEN
    -- Advance winner to next winners round
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
    AND bracket_type = 'winners'
    AND round_number = v_match.round_number + 1
    AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id 
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id 
        WHERE id = v_next_match.id;
      END IF;
    END IF;
    
    -- Send loser to appropriate loser's branch
    IF v_match.round_number = 1 THEN
      -- Losers from Winners Round 1 go to Branch A Round 1
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'losers'
      AND match_stage = 'losers_branch_a_round_1'
      AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
      
      IF FOUND THEN
        IF v_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_loser_id 
          WHERE id = v_next_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_loser_id 
          WHERE id = v_next_match.id;
        END IF;
      END IF;
      
    ELSIF v_match.round_number = 2 THEN
      -- Losers from Winners Round 2 go to Branch B Round 1
      -- This will be implemented when Branch B logic is defined
      NULL;
    END IF;
    
  -- Handle Loser's Branch A advancement  
  ELSIF v_match.bracket_type = 'losers' AND v_match.branch_type = 'Branch A' THEN
    IF v_match.match_stage = 'losers_branch_a_round_1' THEN
      -- Advance to Branch A Round 2
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND match_stage = 'losers_branch_a_round_2'
      AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
      
    ELSIF v_match.match_stage = 'losers_branch_a_round_2' THEN
      -- Advance to Branch A Round 3
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND match_stage = 'losers_branch_a_round_3'
      AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
      
    ELSIF v_match.match_stage = 'losers_branch_a_round_3' THEN
      -- Branch A finalist goes to Grand Final
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND match_stage = 'grand_final'
      AND (player1_id IS NULL OR player2_id IS NULL)
      LIMIT 1;
    END IF;
    
    -- Place winner in next match
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id 
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id 
        WHERE id = v_next_match.id;
      END IF;
    END IF;
  END IF;
  
  -- Log advancement
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    v_match.tournament_id, 'auto_winner_advancement', 'completed',
    jsonb_build_object(
      'version', 'v4',
      'match_id', p_match_id,
      'winner_id', v_winner_id,
      'loser_id', v_loser_id,
      'bracket_type', v_match.bracket_type,
      'match_stage', v_match.match_stage,
      'advancement_logic', 'Fixed Branch A structure'
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_advanced', v_winner_id,
    'loser_placed', v_loser_id,
    'next_match_updated', FOUND
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'match_id', p_match_id
    );
END;
$$;