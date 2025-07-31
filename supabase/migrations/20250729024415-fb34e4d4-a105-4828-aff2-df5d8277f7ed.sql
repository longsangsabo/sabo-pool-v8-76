-- Create update_match_score_safe function for tournament matches
CREATE OR REPLACE FUNCTION public.update_match_score_safe(
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
  v_final_match_check RECORD;
  v_is_final_match BOOLEAN := false;
  v_tournament_completed BOOLEAN := false;
BEGIN
  -- Validate inputs
  IF p_player1_score IS NULL OR p_player2_score IS NULL THEN
    RETURN jsonb_build_object('error', 'Both scores are required');
  END IF;
  
  IF p_player1_score = p_player2_score THEN
    RETURN jsonb_build_object('error', 'Scores cannot be tied in elimination tournaments');
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
  
  -- Get tournament info
  SELECT * INTO v_tournament 
  FROM tournaments 
  WHERE id = v_match.tournament_id;
  
  -- Check if this is a final match (highest round number with match_number = 1)
  SELECT 
    CASE WHEN tm.round_number = (SELECT MAX(round_number) FROM tournament_matches WHERE tournament_id = v_match.tournament_id) 
         AND tm.match_number = 1 
         AND (tm.is_third_place_match IS NULL OR tm.is_third_place_match = false)
    THEN true ELSE false END
  INTO v_is_final_match
  FROM tournament_matches tm 
  WHERE tm.id = p_match_id;
  
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
  
  -- If this is a final match, mark tournament as completed
  IF v_is_final_match THEN
    UPDATE tournaments 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    v_tournament_completed := true;
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
      'submitted_by', p_submitted_by,
      'is_final_match', v_is_final_match,
      'tournament_completed', v_tournament_completed
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'is_final_match', v_is_final_match,
    'tournament_completed', v_tournament_completed,
    'submitted_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Score submission failed: %s', SQLERRM)
    );
END;
$$;