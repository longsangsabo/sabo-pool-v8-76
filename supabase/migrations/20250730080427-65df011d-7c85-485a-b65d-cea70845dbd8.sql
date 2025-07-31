-- ============================================================================
-- SABO 15-TASK SYSTEM - TASKS 5-10 (CONTINUED IMPLEMENTATION)
-- Complete the remaining core tournament advancement functions
-- ============================================================================

-- TASK 4: WINNERS ROUND 3 COMPLETION (Finals Setup)
CREATE OR REPLACE FUNCTION public.process_winners_round3_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_destination text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_loser_id uuid;
  v_semifinal_position text;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_loser_id := CASE WHEN v_match.player1_id = p_winner_id 
                     THEN v_match.player2_id 
                     ELSE v_match.player1_id END;
  
  -- Winners bracket finalists go to different semifinal matches
  v_semifinal_position := CASE WHEN v_match.match_number = 1 THEN 'player1' ELSE 'player2' END;
  
  -- WINNER to Semifinal (Round 250)
  IF v_match.match_number = 1 THEN
    -- First WB finalist → Semifinal Match 1, Player 1
    UPDATE tournament_matches 
    SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 250 AND match_number = 1;
  ELSE
    -- Second WB finalist → Semifinal Match 2, Player 1  
    UPDATE tournament_matches 
    SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 250 AND match_number = 2;
  END IF;
  
  -- LOSER eliminated (no advancement from WB R3 losers)
  
  RETURN QUERY SELECT true,
    format('✅ Winner → Semifinal M%s', v_match.match_number),
    '❌ Loser eliminated';
END;
$$;

-- TASK 5: LOSERS BRANCH A ROUND 1 COMPLETION (R101)
CREATE OR REPLACE FUNCTION public.process_losers_a_round1_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_destination text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_loser_id uuid;
  v_next_match_number integer;
  v_player_position text;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_loser_id := CASE WHEN v_match.player1_id = p_winner_id 
                     THEN v_match.player2_id 
                     ELSE v_match.player1_id END;
  
  -- Calculate advancement: M1,2→R102M1 | M3,4→R102M2
  v_next_match_number := CEIL(v_match.match_number / 2.0);
  v_player_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1' ELSE 'player2' END;
  
  -- WINNER to Losers Branch A Round 2 (R102)
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 102 AND match_number = v_next_match_number;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 102 AND match_number = v_next_match_number;
  END IF;
  
  -- LOSER eliminated
  
  RETURN QUERY SELECT true,
    format('✅ Winner → R102M%s', v_next_match_number),
    '❌ Loser eliminated';
END;
$$;

-- TASK 6: LOSERS BRANCH A ROUND 2 COMPLETION (R102)
CREATE OR REPLACE FUNCTION public.process_losers_a_round2_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_destination text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_loser_id uuid;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_loser_id := CASE WHEN v_match.player1_id = p_winner_id 
                     THEN v_match.player2_id 
                     ELSE v_match.player1_id END;
  
  -- Check if we need to wait for WB R2 losers first
  -- This creates the "merge point" where LB A meets WB R2 losers
  
  -- WINNER to Losers Branch A Round 3 (R103) - the single final match
  UPDATE tournament_matches 
  SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
  WHERE tournament_id = p_tournament_id AND round_number = 103 AND match_number = 1;
  
  -- LOSER eliminated
  
  RETURN QUERY SELECT true,
    '✅ Winner → R103M1 (Branch A Final)',
    '❌ Loser eliminated';
END;
$$;

-- TASK 7: LOSERS BRANCH B ROUND 1 COMPLETION (R201)
CREATE OR REPLACE FUNCTION public.process_losers_b_round1_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_destination text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_loser_id uuid;
  v_player_position text;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_loser_id := CASE WHEN v_match.player1_id = p_winner_id 
                     THEN v_match.player2_id 
                     ELSE v_match.player1_id END;
  
  -- Both R201 winners go to R202M1 (single match)
  v_player_position := CASE WHEN v_match.match_number = 1 THEN 'player1' ELSE 'player2' END;
  
  -- WINNER to Losers Branch B Round 2 (R202)
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 202 AND match_number = 1;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 202 AND match_number = 1;
  END IF;
  
  -- LOSER eliminated
  
  RETURN QUERY SELECT true,
    '✅ Winner → R202M1 (Branch B Final)',
    '❌ Loser eliminated';
END;
$$;

-- TASK 8: LOSERS BRANCH B ROUND 2 COMPLETION (R202)
CREATE OR REPLACE FUNCTION public.process_losers_b_round2_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_destination text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_loser_id uuid;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_loser_id := CASE WHEN v_match.player1_id = p_winner_id 
                     THEN v_match.player2_id 
                     ELSE v_match.player1_id END;
  
  -- Branch B winner goes to Semifinal Match 2, Player 2
  -- (WB finalist will be Player 1, LB B winner is Player 2)
  UPDATE tournament_matches 
  SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
  WHERE tournament_id = p_tournament_id AND round_number = 250 AND match_number = 2;
  
  -- LOSER eliminated
  
  RETURN QUERY SELECT true,
    '✅ Winner → Semifinal M2 (vs WB finalist)',
    '❌ Loser eliminated';
END;
$$;

-- TASK 9: LOSERS BRANCH A ROUND 3 COMPLETION (R103)
CREATE OR REPLACE FUNCTION public.process_losers_a_round3_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_destination text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_loser_id uuid;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_loser_id := CASE WHEN v_match.player1_id = p_winner_id 
                     THEN v_match.player2_id 
                     ELSE v_match.player1_id END;
  
  -- Branch A winner goes to Semifinal Match 1, Player 2
  -- (WB finalist will be Player 1, LB A winner is Player 2)
  UPDATE tournament_matches 
  SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
  WHERE tournament_id = p_tournament_id AND round_number = 250 AND match_number = 1;
  
  -- LOSER eliminated
  
  RETURN QUERY SELECT true,
    '✅ Winner → Semifinal M1 (vs WB finalist)',
    '❌ Loser eliminated';
END;
$$;

-- TASK 10: SEMIFINAL COMPLETION (R250)
CREATE OR REPLACE FUNCTION public.process_semifinal_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_destination text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_loser_id uuid;
  v_player_position text;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_loser_id := CASE WHEN v_match.player1_id = p_winner_id 
                     THEN v_match.player2_id 
                     ELSE v_match.player1_id END;
  
  -- Both semifinal winners go to Grand Final (R300M1)
  v_player_position := CASE WHEN v_match.match_number = 1 THEN 'player1' ELSE 'player2' END;
  
  -- WINNER to Grand Final
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 300 AND match_number = 1;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 300 AND match_number = 1;
  END IF;
  
  -- LOSER gets 3rd/4th place (semifinal loser)
  
  RETURN QUERY SELECT true,
    '🏆 Winner → Grand Final',
    '🥉 Loser → 3rd/4th place';
END;
$$;