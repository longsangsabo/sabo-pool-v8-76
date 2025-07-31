-- Create submit_match_score function for tournament matches
CREATE OR REPLACE FUNCTION public.submit_match_score(
  p_match_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER,
  p_submitted_by UUID
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
  v_tournament RECORD;
  v_advancement_result JSONB;
BEGIN
  -- Validate inputs
  IF p_player1_score IS NULL OR p_player2_score IS NULL THEN
    RETURN jsonb_build_object('error', 'Both scores are required');
  END IF;
  
  IF p_player1_score = p_player2_score THEN
    RETURN jsonb_build_object('error', 'Scores cannot be tied');
  END IF;
  
  -- Get match details
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Check if match is already completed
  IF v_match.status = 'completed' THEN
    RETURN jsonb_build_object('error', 'Match is already completed');
  END IF;
  
  -- Check if both players exist
  IF v_match.player1_id IS NULL OR v_match.player2_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Match does not have both players assigned');
  END IF;
  
  -- Determine winner and loser
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
    v_loser_id := v_match.player2_id;
  ELSE
    v_winner_id := v_match.player2_id;
    v_loser_id := v_match.player1_id;
  END IF;
  
  -- Update match with scores and winner
  UPDATE tournament_matches 
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    actual_end_time = NOW(),
    score_status = 'confirmed',
    score_input_by = p_submitted_by,
    score_submitted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Get tournament info for advancement logic
  SELECT * INTO v_tournament 
  FROM tournaments 
  WHERE id = v_match.tournament_id;
  
  -- For double elimination tournaments, advance the winner
  IF v_tournament.tournament_type = 'double_elimination' THEN
    -- Use existing advancement function
    SELECT repair_double_elimination_bracket(v_match.tournament_id) INTO v_advancement_result;
  END IF;
  
  -- Log the submission
  INSERT INTO tournament_automation_log (
    tournament_id,
    automation_type,
    status,
    details,
    completed_at
  ) VALUES (
    v_match.tournament_id,
    'score_submission',
    'completed',
    jsonb_build_object(
      'match_id', p_match_id,
      'winner_id', v_winner_id,
      'loser_id', v_loser_id,
      'score_player1', p_player1_score,
      'score_player2', p_player2_score,
      'submitted_by', p_submitted_by
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'advancement', v_advancement_result,
    'submitted_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Score submission failed: %s', SQLERRM)
    );
END;
$$;