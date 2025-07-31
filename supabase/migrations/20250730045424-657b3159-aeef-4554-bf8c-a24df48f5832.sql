-- Update the existing update_match_score_safe function to allow club owners and admins
CREATE OR REPLACE FUNCTION public.update_match_score_safe(
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
  v_tournament record;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  -- Allow match participants, admins, and club owners to submit scores
  IF p_submitted_by NOT IN (v_match.player1_id, v_match.player2_id) THEN
    -- Check if user is admin or club owner
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = p_submitted_by 
      AND (is_admin = true OR role = 'club_owner')
    ) THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Only match participants, admins, or club owners can submit scores'
      );
    END IF;
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
  
  -- Use Double1-based advancement for double elimination tournaments
  IF v_tournament.tournament_type = 'double_elimination' THEN
    SELECT advance_tournament_like_double1(
      v_match.tournament_id,
      p_match_id,
      v_winner_id
    ) INTO v_advancement_result;
  ELSE
    -- For other tournament types, use existing advancement logic
    v_advancement_result := jsonb_build_object(
      'success', true,
      'message', 'Score submitted for non-double elimination tournament'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Score submitted successfully',
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