-- Fix the SABO advancement function to properly separate Losers Branch A and B
CREATE OR REPLACE FUNCTION public.advance_sabo_tournament_fixed(
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
  v_round_info text;
BEGIN
  -- Get completed match details
  SELECT * INTO v_completed_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Determine loser
  IF v_completed_match.player1_id = p_winner_id THEN
    v_loser_id := v_completed_match.player2_id;
  ELSE
    v_loser_id := v_completed_match.player1_id;
  END IF;
  
  v_round_info := format('R%s M%s', v_completed_match.round_number, v_completed_match.match_number);
  
  -- ✅ WINNERS BRACKET ADVANCEMENT (Rounds 1, 2, 3)
  IF v_completed_match.round_number = 1 THEN
    -- Winner advances to Round 2
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 2
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches SET player1_id = p_winner_id, status = 'scheduled' WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches SET player2_id = p_winner_id, status = 'scheduled' WHERE id = v_next_match_id;
      END IF;
    END IF;
    
    -- ✅ LOSER GOES TO LOSERS BRANCH A ONLY (Round 101)
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 101
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches SET player1_id = v_loser_id, status = 'scheduled' WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches SET player2_id = v_loser_id, status = 'scheduled' WHERE id = v_next_match_id;
      END IF;
    END IF;
    
  ELSIF v_completed_match.round_number = 2 THEN
    -- Winner advances to Round 3 (Semifinals)
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 3
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches SET player1_id = p_winner_id, status = 'scheduled' WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches SET player2_id = p_winner_id, status = 'scheduled' WHERE id = v_next_match_id;
      END IF;
    END IF;
    
    -- ✅ LOSER GOES TO LOSERS BRANCH B ONLY (Round 201)
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 201
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches SET player1_id = v_loser_id, status = 'scheduled' WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches SET player2_id = v_loser_id, status = 'scheduled' WHERE id = v_next_match_id;
      END IF;
    END IF;
    
  ELSIF v_completed_match.round_number = 3 THEN
    -- Winner advances to Finals (Round 250/300)
    -- Loser is eliminated (no advancement)
    NULL;
    
  -- ✅ LOSERS BRANCH A INTERNAL ADVANCEMENT (101→102→103)
  ELSIF v_completed_match.round_number = 101 THEN
    -- Round 101 winner advances to Round 102
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 102
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches SET player1_id = p_winner_id, status = 'scheduled' WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches SET player2_id = p_winner_id, status = 'scheduled' WHERE id = v_next_match_id;
      END IF;
    END IF;
    -- Loser from Round 101 is eliminated
    
  ELSIF v_completed_match.round_number = 102 THEN
    -- Round 102 winner advances to Round 103
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 103
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches SET player1_id = p_winner_id, status = 'scheduled' WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches SET player2_id = p_winner_id, status = 'scheduled' WHERE id = v_next_match_id;
      END IF;
    END IF;
    -- Loser from Round 102 is eliminated
    
  -- ✅ LOSERS BRANCH B INTERNAL ADVANCEMENT (201→202)  
  ELSIF v_completed_match.round_number = 201 THEN
    -- Round 201 winner advances to Round 202
    SELECT id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
      AND round_number = 202
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      IF (SELECT player1_id FROM tournament_matches WHERE id = v_next_match_id) IS NULL THEN
        UPDATE tournament_matches SET player1_id = p_winner_id, status = 'scheduled' WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches SET player2_id = p_winner_id, status = 'scheduled' WHERE id = v_next_match_id;
      END IF;
    END IF;
    -- Loser from Round 201 is eliminated
    
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', format('Advanced %s successfully - branches kept separate', v_round_info),
    'tournament_id', p_tournament_id,
    'completed_match', v_round_info,
    'winner_id', p_winner_id,
    'branch_separation', 'enforced'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id,
      'match_info', v_round_info
    );
END;
$$;