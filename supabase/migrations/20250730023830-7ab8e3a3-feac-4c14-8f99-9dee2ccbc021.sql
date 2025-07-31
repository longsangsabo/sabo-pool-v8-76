-- Update function to use correct column names (score_player1, score_player2)
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
  v_tournament_id uuid;
BEGIN
  -- Get match details
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Match not found', null::uuid;
    RETURN;
  END IF;
  
  -- Accept both scheduled and in_progress status
  IF v_match.status NOT IN ('scheduled', 'in_progress') THEN
    RETURN QUERY SELECT false, 
      format('Match not ready for score submission. Status: %s', v_match.status), 
      null::uuid;
    RETURN;
  END IF;
  
  -- Auto-start match if scheduled
  IF v_match.status = 'scheduled' THEN
    UPDATE tournament_matches 
    SET 
      status = 'in_progress',
      updated_at = NOW()
    WHERE id = p_match_id;
  END IF;
  
  -- Validate scores
  IF p_player1_score < 0 OR p_player2_score < 0 THEN
    RETURN QUERY SELECT false, 'Scores cannot be negative', null::uuid;
    RETURN;
  END IF;
  
  IF p_player1_score = p_player2_score THEN
    RETURN QUERY SELECT false, 'Matches cannot end in a tie', null::uuid;
    RETURN;
  END IF;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSE
    v_winner_id := v_match.player2_id;
  END IF;
  
  -- Update match with scores and winner using CORRECT column names
  UPDATE tournament_matches 
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    score_input_by = p_submitted_by,
    score_submitted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Get tournament ID for advancement
  v_tournament_id := v_match.tournament_id;
  
  -- Trigger tournament advancement
  PERFORM advance_double_elimination_v9_fixed(v_tournament_id);
  
  RETURN QUERY SELECT true, 'Score submitted successfully', v_winner_id;
END;
$$;