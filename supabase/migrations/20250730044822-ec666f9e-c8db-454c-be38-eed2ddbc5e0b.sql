-- Create improved score submission function using Double1 advancement
CREATE OR REPLACE FUNCTION public.submit_sabo_match_score(
  p_match_id uuid,
  p_player1_score integer,
  p_player2_score integer,
  p_submitted_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_winner_id uuid;
  v_advancement_result jsonb;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Validate submitter (must be one of the players)
  IF p_submitted_by NOT IN (v_match.player1_id, v_match.player2_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only match participants can submit scores');
  END IF;
  
  -- Auto-start match if scheduled
  IF v_match.status = 'scheduled' THEN
    UPDATE tournament_matches 
    SET status = 'in_progress', updated_at = NOW()
    WHERE id = p_match_id;
  END IF;
  
  -- Determine winner based on scores
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Scores cannot be tied');
  END IF;
  
  -- Update match with scores and winner
  UPDATE tournament_matches 
  SET 
    player1_score = p_player1_score,
    player2_score = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- ✅ USE DOUBLE1-BASED ADVANCEMENT (the key fix!)
  SELECT advance_tournament_like_double1(
    v_match.tournament_id,
    p_match_id,
    v_winner_id
  ) INTO v_advancement_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Score submitted with Double1-pattern advancement',
    'winner_id', v_winner_id,
    'match_id', p_match_id,
    'player1_score', p_player1_score,
    'player2_score', p_player2_score,
    'advancement_result', v_advancement_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Score submission failed: %s', SQLERRM)
    );
END;
$$;