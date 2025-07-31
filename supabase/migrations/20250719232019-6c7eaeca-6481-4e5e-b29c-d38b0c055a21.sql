
-- Create RPC function for Double Elimination score submission
CREATE OR REPLACE FUNCTION public.submit_double_elimination_score(
  p_match_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER,
  p_submitted_by UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_tournament RECORD;
  v_result JSONB;
BEGIN
  -- Get match details
  SELECT * INTO v_match
  FROM tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament info
  SELECT * INTO v_tournament
  FROM tournaments
  WHERE id = v_match.tournament_id;
  
  -- Determine winner and loser
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
    v_loser_id := v_match.player2_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
    v_loser_id := v_match.player1_id;
  ELSE
    RETURN jsonb_build_object('error', 'Scores cannot be tied');
  END IF;
  
  -- Update match with scores
  UPDATE tournament_matches
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    score_status = 'confirmed',
    score_confirmed_by = p_submitted_by,
    score_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Advance winner in Double Elimination bracket
  SELECT advance_double_elimination_winner(p_match_id, v_winner_id, v_loser_id) INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', v_winner_id,
    'advancement', v_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to submit score: ' || SQLERRM
    );
END;
$$;

-- Create RPC function for Single Elimination score submission
CREATE OR REPLACE FUNCTION public.submit_single_elimination_score(
  p_match_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER,
  p_submitted_by UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_tournament RECORD;
  v_result JSONB;
BEGIN
  -- Get match details
  SELECT * INTO v_match
  FROM tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament info
  SELECT * INTO v_tournament
  FROM tournaments
  WHERE id = v_match.tournament_id;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
  ELSE
    RETURN jsonb_build_object('error', 'Scores cannot be tied');
  END IF;
  
  -- Update match with scores
  UPDATE tournament_matches
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    score_status = 'confirmed',
    score_confirmed_by = p_submitted_by,
    score_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Advance winner in Single Elimination bracket
  SELECT advance_single_elimination_winner(p_match_id) INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', v_winner_id,
    'advancement', v_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to submit score: ' || SQLERRM
    );
END;
$$;
