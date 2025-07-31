-- Update advancement function với round numbering đã sửa
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
    -- Advance winner to next winner round (Rounds 1-2 only)
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
        RAISE NOTICE 'Advanced winner % to WB Round %', v_winner_id, v_match.round_number + 1;
      END IF;
    ELSIF v_match.round_number = 3 THEN
      -- Winner from WB Round 3 goes to Semifinal (Round 4)
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'semifinal'
        AND round_number = 4
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
        RAISE NOTICE 'Advanced WB Round 3 winner % to Semifinal %', v_winner_id, v_match.match_number;
      END IF;
    END IF;
    
    -- Send loser to appropriate Loser Bracket branch
    IF v_match.round_number = 1 THEN
      -- Loser from WB Round 1 → Branch A Round 1
      SELECT * INTO v_loser_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'loser'
        AND branch_type = 'branch_a'
        AND round_number = 1
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
        RAISE NOTICE 'Sent WB Round 1 loser % to Branch A Round 1', v_loser_id;
      END IF;
      
    ELSIF v_match.round_number = 2 THEN
      -- Loser from WB Round 2 → Branch B Round 1
      SELECT * INTO v_loser_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'loser'
        AND branch_type = 'branch_b'
        AND round_number = 1
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
        RAISE NOTICE 'Sent WB Round 2 loser % to Branch B Round 1', v_loser_id;
      END IF;
    END IF;
  
  -- 🔽 LOSER BRACKET advancement logic
  ELSIF v_match.bracket_type = 'loser' THEN
    IF v_match.branch_type = 'branch_a' THEN
      -- Advance within Branch A
      IF v_match.round_number < 3 THEN
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
      ELSIF v_match.round_number = 3 THEN
        -- Branch A Final → Semifinal Round 4 Match 1
        SELECT * INTO v_next_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'semifinal'
          AND round_number = 4
          AND match_number = 1
          AND (player2_id IS NULL);
        
        IF FOUND THEN
          UPDATE tournament_matches 
          SET player2_id = v_winner_id, status = 'scheduled'
          WHERE id = v_next_match.id;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      END IF;
      
    ELSIF v_match.branch_type = 'branch_b' THEN
      -- Advance within Branch B
      IF v_match.round_number < 2 THEN
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
      ELSIF v_match.round_number = 2 THEN
        -- Branch B Final → Semifinal Round 4 Match 2
        SELECT * INTO v_next_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'semifinal'
          AND round_number = 4
          AND match_number = 2
          AND (player2_id IS NULL);
        
        IF FOUND THEN
          UPDATE tournament_matches 
          SET player2_id = v_winner_id, status = 'scheduled'
          WHERE id = v_next_match.id;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      END IF;
    END IF;
  
  -- 🏁 SEMIFINAL advancement logic
  ELSIF v_match.bracket_type = 'semifinal' THEN
    -- Semifinal winners go to Final (Round 5)
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'final'
      AND round_number = 5
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