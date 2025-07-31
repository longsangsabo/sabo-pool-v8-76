-- Create function to fix final match with correct players
CREATE OR REPLACE FUNCTION public.fix_final_match(
  p_final_match_id UUID,
  p_player1_id UUID,
  p_player2_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update final match with correct players
  UPDATE tournament_matches 
  SET 
    player1_id = p_player1_id,
    player2_id = p_player2_id,
    status = 'scheduled',
    score_player1 = 0,
    score_player2 = 0,
    winner_id = NULL,
    updated_at = NOW()
  WHERE id = p_final_match_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Final match fixed successfully',
    'match_id', p_final_match_id,
    'player1_id', p_player1_id,
    'player2_id', p_player2_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to fix final match: ' || SQLERRM
    );
END;
$$;