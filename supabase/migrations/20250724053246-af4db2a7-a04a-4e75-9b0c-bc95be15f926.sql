-- Fix Double Elimination Bracket Structure according to new guidelines
-- 🏗️ KIẾN TRÚC CHUẨN: Winner Bracket (3 rounds) + Loser Bracket (Branch A/B) + Final Stage

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
  v_current_round INTEGER;
  v_matches_in_round INTEGER;
  i INTEGER;
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
  
  IF v_participant_count IS NULL OR v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Not enough participants');
  END IF;
  
  -- Validate participant count (must be power of 2, max 16 for current logic)
  IF v_participant_count NOT IN (4, 8, 16) THEN
    RETURN jsonb_build_object('error', 'Participant count must be 4, 8, or 16 for double elimination');
  END IF;
  
  -- 🏆 A. WINNER'S BRACKET (3 rounds - DỪNG tại 2 người)
  RAISE NOTICE 'Creating Winner Bracket for % participants', v_participant_count;
  
  -- Winner Round 1: 16→8 (8 matches)
  v_matches_in_round := v_participant_count / 2;
  FOR i IN 1..v_matches_in_round LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 1, i, 'winner', NULL,
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Winner Round 2: 8→4 (4 matches)
  v_matches_in_round := v_matches_in_round / 2;
  FOR i IN 1..v_matches_in_round LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 2, i, 'winner', NULL,
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Winner Round 3: 4→2 (2 matches) - DỪNG tại 2 finalists
  v_matches_in_round := v_matches_in_round / 2;
  FOR i IN 1..v_matches_in_round LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 3, i, 'winner', NULL,
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- 🔽 B. LOSER'S BRACKET - Branch A (Người thua từ WB Round 1)
  RAISE NOTICE 'Creating Loser Bracket Branch A';
  
  -- LB Branch A Round 1: 8→4 (4 matches)
  FOR i IN 1..(v_participant_count / 4) LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 4, i, 'loser', 'branch_a',
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
      p_tournament_id, 5, i, 'loser', 'branch_a',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- LB Branch A Round 3: 2→1 (1 match) - FINALIST từ Branch A
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, branch_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 6, 1, 'loser', 'branch_a',
    'pending', NOW(), NOW()
  );
  v_matches_created := v_matches_created + 1;
  
  -- 🔽 B. LOSER'S BRACKET - Branch B (Người thua từ WB Round 2)
  RAISE NOTICE 'Creating Loser Bracket Branch B';
  
  -- LB Branch B Round 1: 4→2 (2 matches)
  FOR i IN 1..(v_participant_count / 8) LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 7, i, 'loser', 'branch_b',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- LB Branch B Round 2: 2→1 (1 match) - FINALIST từ Branch B
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, branch_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 8, 1, 'loser', 'branch_b',
    'pending', NOW(), NOW()
  );
  v_matches_created := v_matches_created + 1;
  
  -- 🏁 C. GIAI ĐOẠN CUỐI
  RAISE NOTICE 'Creating Final Stage';
  
  -- Bán kết chung: 4→2 (2 matches)
  -- 2 từ Winner + 1 từ Branch A + 1 từ Branch B
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, branch_type,
      status, created_at, updated_at
    ) VALUES (
      p_tournament_id, 9, i, 'semifinal', NULL,
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Chung kết: 2→1 (1 match) - CHAMPION
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, branch_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 10, 1, 'final', NULL,
    'pending', NOW(), NOW()
  );
  v_matches_created := v_matches_created + 1;
  
  -- 🎯 Assign participants to Winner Round 1 matches
  FOR i IN 1..(v_participant_count / 2) LOOP
    UPDATE tournament_matches
    SET 
      player1_id = v_participant_ids[i * 2 - 1],
      player2_id = v_participant_ids[i * 2],
      status = 'scheduled'
    WHERE tournament_id = p_tournament_id
      AND round_number = 1
      AND match_number = i
      AND bracket_type = 'winner';
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'matches_created', v_matches_created,
    'structure', jsonb_build_object(
      'winner_rounds', 3,
      'loser_branch_a_rounds', 3, 
      'loser_branch_b_rounds', 2,
      'semifinal_rounds', 1,
      'final_rounds', 1
    ),
    'message', 'Double elimination bracket created with new architecture'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to create double elimination bracket: ' || SQLERRM
    );
END;
$$;

-- Update advance_double_elimination_winner function for new architecture
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner(
  p_match_id uuid,
  p_winner_id uuid DEFAULT NULL,
  p_loser_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_match RECORD;
  v_loser_match RECORD;
  v_advancement_count INTEGER := 0;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Determine winner and loser
  v_winner_id := COALESCE(p_winner_id, v_match.winner_id);
  v_loser_id := COALESCE(p_loser_id, 
    CASE WHEN v_winner_id = v_match.player1_id THEN v_match.player2_id 
         ELSE v_match.player1_id END);
  
  IF v_winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No winner specified');
  END IF;
  
  RAISE NOTICE 'Processing advancement for match % (R% M% %) - Winner: %, Loser: %', 
    v_match.id, v_match.round_number, v_match.match_number, v_match.bracket_type, v_winner_id, v_loser_id;
  
  -- 🏆 WINNER BRACKET advancement logic
  IF v_match.bracket_type = 'winner' THEN
    -- Advance winner to next winner round (if exists)
    IF v_match.round_number < 3 THEN
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'winner'
        AND round_number = v_match.round_number + 1
        AND match_number = CEIL(v_match.match_number::numeric / 2)
        AND (player1_id IS NULL OR player2_id IS NULL);
      
      IF FOUND THEN
        IF v_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_winner_id, status = 'scheduled'
          WHERE id = v_next_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_winner_id, status = 'scheduled'
          WHERE id = v_next_match.id;
        END IF;
        v_advancement_count := v_advancement_count + 1;
      END IF;
    ELSIF v_match.round_number = 3 THEN
      -- Winner from Round 3 goes to Semifinal
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'semifinal'
        AND match_number = v_match.match_number
        AND (player1_id IS NULL OR player2_id IS NULL);
      
      IF FOUND THEN
        IF v_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_winner_id, status = 'scheduled'
          WHERE id = v_next_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_winner_id, status = 'scheduled'
          WHERE id = v_next_match.id;
        END IF;
        v_advancement_count := v_advancement_count + 1;
      END IF;
    END IF;
    
    -- Send loser to appropriate Loser Bracket branch
    IF v_match.round_number = 1 THEN
      -- Loser from WB Round 1 → Branch A
      SELECT * INTO v_loser_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'loser'
        AND branch_type = 'branch_a'
        AND round_number = 4
        AND match_number = CEIL(v_match.match_number::numeric / 2)
        AND (player1_id IS NULL OR player2_id IS NULL);
      
      IF FOUND THEN
        IF v_loser_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_loser_id, status = 'scheduled'
          WHERE id = v_loser_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_loser_id, status = 'scheduled'
          WHERE id = v_loser_match.id;
        END IF;
        v_advancement_count := v_advancement_count + 1;
      END IF;
      
    ELSIF v_match.round_number = 2 THEN
      -- Loser from WB Round 2 → Branch B
      SELECT * INTO v_loser_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'loser'
        AND branch_type = 'branch_b'
        AND round_number = 7
        AND match_number = v_match.match_number
        AND (player1_id IS NULL OR player2_id IS NULL);
      
      IF FOUND THEN
        IF v_loser_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_loser_id, status = 'scheduled'
          WHERE id = v_loser_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_loser_id, status = 'scheduled'
          WHERE id = v_loser_match.id;
        END IF;
        v_advancement_count := v_advancement_count + 1;
      END IF;
    END IF;
  
  -- 🔽 LOSER BRACKET advancement logic
  ELSIF v_match.bracket_type = 'loser' THEN
    IF v_match.branch_type = 'branch_a' THEN
      -- Advance within Branch A
      IF v_match.round_number < 6 THEN
        SELECT * INTO v_next_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'loser'
          AND branch_type = 'branch_a'
          AND round_number = v_match.round_number + 1
          AND match_number = CEIL(v_match.match_number::numeric / 2)
          AND (player1_id IS NULL OR player2_id IS NULL);
        
        IF FOUND THEN
          IF v_next_match.player1_id IS NULL THEN
            UPDATE tournament_matches 
            SET player1_id = v_winner_id, status = 'scheduled'
            WHERE id = v_next_match.id;
          ELSE
            UPDATE tournament_matches 
            SET player2_id = v_winner_id, status = 'scheduled'
            WHERE id = v_next_match.id;
          END IF;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      ELSIF v_match.round_number = 6 THEN
        -- Branch A Final → Semifinal (match 1)
        SELECT * INTO v_next_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'semifinal'
          AND match_number = 1
          AND (player1_id IS NULL OR player2_id IS NULL);
        
        IF FOUND THEN
          IF v_next_match.player1_id IS NULL THEN
            UPDATE tournament_matches 
            SET player1_id = v_winner_id, status = 'scheduled'
            WHERE id = v_next_match.id;
          ELSE
            UPDATE tournament_matches 
            SET player2_id = v_winner_id, status = 'scheduled'
            WHERE id = v_next_match.id;
          END IF;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      END IF;
      
    ELSIF v_match.branch_type = 'branch_b' THEN
      -- Advance within Branch B
      IF v_match.round_number < 8 THEN
        SELECT * INTO v_next_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'loser'
          AND branch_type = 'branch_b'
          AND round_number = v_match.round_number + 1
          AND (player1_id IS NULL OR player2_id IS NULL);
        
        IF FOUND THEN
          IF v_next_match.player1_id IS NULL THEN
            UPDATE tournament_matches 
            SET player1_id = v_winner_id, status = 'scheduled'
            WHERE id = v_next_match.id;
          ELSE
            UPDATE tournament_matches 
            SET player2_id = v_winner_id, status = 'scheduled'
            WHERE id = v_next_match.id;
          END IF;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      ELSIF v_match.round_number = 8 THEN
        -- Branch B Final → Semifinal (match 2)
        SELECT * INTO v_next_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'semifinal'
          AND match_number = 2
          AND (player1_id IS NULL OR player2_id IS NULL);
        
        IF FOUND THEN
          IF v_next_match.player1_id IS NULL THEN
            UPDATE tournament_matches 
            SET player1_id = v_winner_id, status = 'scheduled'
            WHERE id = v_next_match.id;
          ELSE
            UPDATE tournament_matches 
            SET player2_id = v_winner_id, status = 'scheduled'
            WHERE id = v_next_match.id;
          END IF;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      END IF;
    END IF;
  
  -- 🏁 SEMIFINAL advancement logic
  ELSIF v_match.bracket_type = 'semifinal' THEN
    -- Semifinal winners go to Final
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'final'
      AND (player1_id IS NULL OR player2_id IS NULL);
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, status = 'scheduled'
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, status = 'scheduled'
        WHERE id = v_next_match.id;
      END IF;
      v_advancement_count := v_advancement_count + 1;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'advancements', v_advancement_count,
    'bracket_type', v_match.bracket_type,
    'branch_type', v_match.branch_type,
    'round_number', v_match.round_number
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM,
      'match_id', p_match_id
    );
END;
$$;