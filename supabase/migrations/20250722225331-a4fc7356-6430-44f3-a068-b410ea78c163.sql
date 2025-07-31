-- Create a simple and safe match score update function
CREATE OR REPLACE FUNCTION public.update_match_score_safe(
  p_match_id uuid,
  p_player1_score integer,
  p_player2_score integer,
  p_submitted_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_winner_id UUID;
  v_match RECORD;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM public.tournament_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
  ELSE
    RETURN jsonb_build_object('error', 'Scores cannot be equal');
  END IF;
  
  -- Simple update without triggering problematic functions
  UPDATE public.tournament_matches
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Log the successful update
  RAISE NOTICE 'Successfully updated match % with scores %-%', p_match_id, p_player1_score, p_player2_score;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', v_winner_id,
    'match_id', p_match_id,
    'player1_score', p_player1_score,
    'player2_score', p_player2_score
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating match score: %', SQLERRM;
    RETURN jsonb_build_object(
      'error', format('Failed to update match score: %s', SQLERRM)
    );
END;
$$;