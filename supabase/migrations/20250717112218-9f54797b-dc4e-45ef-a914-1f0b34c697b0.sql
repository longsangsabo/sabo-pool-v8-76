-- Create stored procedure to update tournament match scores safely
CREATE OR REPLACE FUNCTION public.update_tournament_match_score(
  p_match_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER,
  p_winner_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_match RECORD;
  v_updated_match RECORD;
BEGIN
  -- Get the match details first
  SELECT * INTO v_match
  FROM public.tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Match not found'
    );
  END IF;
  
  -- Check permissions
  IF NOT public.can_user_update_tournament_match(v_match.tournament_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Permission denied'
    );
  END IF;
  
  -- Update the match
  UPDATE public.tournament_matches
  SET 
    player1_score = p_player1_score,
    player2_score = p_player2_score,
    winner_id = p_winner_id,
    status = CASE 
      WHEN p_winner_id IS NOT NULL THEN 'completed'
      ELSE status
    END,
    actual_end_time = CASE
      WHEN p_winner_id IS NOT NULL THEN NOW()
      ELSE actual_end_time
    END,
    updated_at = NOW()
  WHERE id = p_match_id
  RETURNING * INTO v_updated_match;
  
  -- If winner is determined and this is single elimination, advance winner
  IF p_winner_id IS NOT NULL THEN
    DECLARE
      v_advance_result jsonb;
    BEGIN
      SELECT public.advance_tournament_winner(p_match_id, p_winner_id) INTO v_advance_result;
      
      RETURN jsonb_build_object(
        'success', true,
        'match', row_to_json(v_updated_match),
        'advancement', v_advance_result
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but still return the match update as successful
        RETURN jsonb_build_object(
          'success', true,
          'match', row_to_json(v_updated_match),
          'advancement_error', SQLERRM
        );
    END;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match', row_to_json(v_updated_match)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', SQLSTATE
    );
END;
$$;