-- Create advancement function based on Double1's proven pattern
CREATE OR REPLACE FUNCTION public.advance_tournament_like_double1(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed_match record;
  v_loser_id uuid;
  v_next_match_id uuid;
  v_log text := '';
  v_result jsonb;
BEGIN
  -- Get completed match details
  SELECT * INTO v_completed_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  -- Determine loser
  IF v_completed_match.player1_id = p_winner_id THEN
    v_loser_id := v_completed_match.player2_id;
  ELSE
    v_loser_id := v_completed_match.player1_id;
  END IF;
  
  -- ✅ ROUND 1 ADVANCEMENT (based on Double1 pattern)
  IF v_completed_match.round_number = 1 THEN
    -- Winner advances to Round 2 (Winners Bracket)
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 2
      AND status = 'pending' 
      AND (player1_id IS NULL OR player2_id IS NULL)
      -- ✅ CRITICAL: Prevent duplicate assignments
      AND NOT EXISTS (
        SELECT 1 FROM tournament_matches tm2 
        WHERE tm2.tournament_id = p_tournament_id 
          AND tm2.round_number = 2
          AND (tm2.player1_id = p_winner_id OR tm2.player2_id = p_winner_id)
      )
    ORDER BY match_number 
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      v_log := v_log || format('Winner %s → Round 2. ', p_winner_id);
    END IF;
    
    -- Loser goes to Losers Branch A (Round 101)
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 101
      AND status = 'pending' 
      AND (player1_id IS NULL OR player2_id IS NULL)
      -- ✅ CRITICAL: Prevent duplicate assignments
      AND NOT EXISTS (
        SELECT 1 FROM tournament_matches tm2 
        WHERE tm2.tournament_id = p_tournament_id 
          AND tm2.round_number = 101
          AND (tm2.player1_id = v_loser_id OR tm2.player2_id = v_loser_id)
      )
    ORDER BY match_number 
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      v_log := v_log || format('Loser %s → Losers Branch A. ', v_loser_id);
    END IF;
    
  -- ✅ ROUND 2 ADVANCEMENT
  ELSIF v_completed_match.round_number = 2 THEN
    -- Winner to Round 3
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 3
      AND status = 'pending' 
      AND (player1_id IS NULL OR player2_id IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM tournament_matches tm2 
        WHERE tm2.tournament_id = p_tournament_id 
          AND tm2.round_number = 3
          AND (tm2.player1_id = p_winner_id OR tm2.player2_id = p_winner_id)
      )
    ORDER BY match_number 
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      v_log := v_log || format('Winner %s → Round 3. ', p_winner_id);
    END IF;
    
    -- Loser to Losers Branch B (Round 201)
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 201
      AND status = 'pending' 
      AND (player1_id IS NULL OR player2_id IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM tournament_matches tm2 
        WHERE tm2.tournament_id = p_tournament_id 
          AND tm2.round_number = 201
          AND (tm2.player1_id = v_loser_id OR tm2.player2_id = v_loser_id)
      )
    ORDER BY match_number 
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      v_log := v_log || format('Loser %s → Losers Branch B. ', v_loser_id);
    END IF;
    
  -- ✅ LOSERS BRANCH A ADVANCEMENT (101 → 102 → 103)
  ELSIF v_completed_match.round_number = 101 THEN
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 102
      AND status = 'pending' 
      AND (player1_id IS NULL OR player2_id IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM tournament_matches tm2 
        WHERE tm2.tournament_id = p_tournament_id 
          AND tm2.round_number = 102
          AND (tm2.player1_id = p_winner_id OR tm2.player2_id = p_winner_id)
      )
    ORDER BY match_number 
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      v_log := v_log || format('Losers A winner %s → Round 102. ', p_winner_id);
    END IF;
    
  -- ✅ LOSERS BRANCH A ROUND 102 → 103
  ELSIF v_completed_match.round_number = 102 THEN
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 103
      AND status = 'pending' 
      AND (player1_id IS NULL OR player2_id IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM tournament_matches tm2 
        WHERE tm2.tournament_id = p_tournament_id 
          AND tm2.round_number = 103
          AND (tm2.player1_id = p_winner_id OR tm2.player2_id = p_winner_id)
      )
    ORDER BY match_number 
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      v_log := v_log || format('Losers A102 winner %s → Round 103. ', p_winner_id);
    END IF;
    
  -- ✅ LOSERS BRANCH B ADVANCEMENT (201 → 202)
  ELSIF v_completed_match.round_number = 201 THEN
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 202
      AND status = 'pending' 
      AND (player1_id IS NULL OR player2_id IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM tournament_matches tm2 
        WHERE tm2.tournament_id = p_tournament_id 
          AND tm2.round_number = 202
          AND (tm2.player1_id = p_winner_id OR tm2.player2_id = p_winner_id)
      )
    ORDER BY match_number 
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      v_log := v_log || format('Losers B winner %s → Round 202. ', p_winner_id);
    END IF;
    
  -- ✅ SEMIFINALS AND FINALS ADVANCEMENT
  ELSIF v_completed_match.round_number IN (3, 103, 202, 250) THEN
    -- Advance to next available round (semifinals or finals)
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number > v_completed_match.round_number
      AND status = 'pending' 
      AND (player1_id IS NULL OR player2_id IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM tournament_matches tm2 
        WHERE tm2.tournament_id = p_tournament_id 
          AND tm2.round_number > v_completed_match.round_number
          AND (tm2.player1_id = p_winner_id OR tm2.player2_id = p_winner_id)
      )
    ORDER BY round_number, match_number 
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
        WHERE id = v_next_match_id;
      END IF;
      v_log := v_log || format('Advanced winner %s to next round. ', p_winner_id);
    END IF;
  END IF;
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Advancement completed using Double1 pattern',
    'advancement_log', v_log,
    'completed_match_round', v_completed_match.round_number,
    'winner_id', p_winner_id,
    'loser_id', v_loser_id
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'advancement_log', v_log
    );
END;
$$;