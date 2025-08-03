-- Fix submit_sabo_match_score function to work without coordinator dependency
CREATE OR REPLACE FUNCTION public.submit_sabo_match_score(
  p_match_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER,
  p_submitted_by UUID
)
RETURNS JSONB AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_winner_id UUID;
BEGIN
  -- Get match information
  SELECT * INTO v_match
  FROM tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Match not found',
      'match_id', p_match_id
    );
  END IF;
  
  -- Get tournament information
  SELECT * INTO v_tournament
  FROM tournaments
  WHERE id = v_match.tournament_id;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tie games not allowed',
      'match_id', p_match_id
    );
  END IF;
  
  -- Update the match with scores and winner
  UPDATE tournament_matches 
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    actual_end_time = NOW(),
    score_submitted_at = NOW(),
    score_input_by = p_submitted_by,
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- The trigger will automatically handle advancement via sabo_tournament_coordinator
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Score submitted successfully',
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'tournament_id', v_match.tournament_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', 'Error in submit_sabo_match_score function',
      'match_id', p_match_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;