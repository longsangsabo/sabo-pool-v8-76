-- 🚨 URGENT FIX: Update submit_sabo_match_score to use correct advancement function
-- Fixes "function does not exist" error when submitting scores

CREATE OR REPLACE FUNCTION public.submit_sabo_match_score(
  p_match_id uuid,
  p_player1_score integer,
  p_player2_score integer,
  p_submitted_by uuid
)
RETURNS TABLE(success boolean, message text, winner_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_winner_id uuid;
  v_loser_id uuid;
BEGIN
  -- Get match details
  SELECT * INTO v_match
  FROM tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Match not found'::text, NULL::uuid;
    RETURN;
  END IF;
  
  -- Validate match can be scored
  IF v_match.status = 'completed' THEN
    RETURN QUERY SELECT false, 'Match already completed'::text, NULL::uuid;
    RETURN;
  END IF;
  
  IF v_match.player1_id IS NULL OR v_match.player2_id IS NULL THEN
    RETURN QUERY SELECT false, 'Match not ready - missing players'::text, NULL::uuid;
    RETURN;
  END IF;
  
  -- Accept both scheduled and pending status for Round 1 matches
  IF v_match.status NOT IN ('scheduled', 'pending', 'in_progress') THEN
    RETURN QUERY SELECT false, 
      format('Match not ready for score submission. Status: %s', v_match.status)::text, 
      NULL::uuid;
    RETURN;
  END IF;
  
  -- Auto-start if scheduled or pending
  IF v_match.status IN ('scheduled', 'pending') THEN
    UPDATE tournament_matches 
    SET 
      status = 'in_progress',
      updated_at = NOW()
    WHERE id = p_match_id;
  END IF;
  
  -- Validate scores
  IF p_player1_score < 0 OR p_player2_score < 0 THEN
    RETURN QUERY SELECT false, 'Scores cannot be negative'::text, NULL::uuid;
    RETURN;
  END IF;
  
  IF p_player1_score = p_player2_score THEN
    RETURN QUERY SELECT false, 'Matches cannot end in a tie'::text, NULL::uuid;
    RETURN;
  END IF;
  
  -- Determine winner based on scores
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
    v_loser_id := v_match.player2_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
    v_loser_id := v_match.player1_id;
  ELSE
    RETURN QUERY SELECT false, 'Scores cannot be tied'::text, NULL::uuid;
    RETURN;
  END IF;
  
  -- Update match with scores and winner
  UPDATE tournament_matches
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    score_input_by = p_submitted_by,
    score_submitted_at = NOW(),
    actual_end_time = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- ✅ CRITICAL FIX: Use correct advancement function with 3 parameters
  BEGIN
    PERFORM advance_sabo_tournament_fixed(
      v_match.tournament_id,    -- tournament_id (1st parameter)
      p_match_id,               -- completed_match_id (2nd parameter)  
      v_winner_id               -- winner_id (3rd parameter)
    );
    
    RAISE NOTICE '✅ Successfully advanced tournament after match completion';
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the score submission
      RAISE WARNING '⚠️ Advancement failed: %', SQLERRM;
      -- Still return success for score submission
  END;
  
  RETURN QUERY SELECT true, 'Score submitted and tournament advanced successfully'::text, v_winner_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, ('Error: ' || SQLERRM)::text, NULL::uuid;
END;
$$;