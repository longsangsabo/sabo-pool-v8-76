-- Create function to edit confirmed tournament match scores
CREATE OR REPLACE FUNCTION public.edit_confirmed_score(
  p_match_id uuid, 
  p_new_player1_score integer, 
  p_new_player2_score integer, 
  p_editor_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_old_winner_id UUID;
  v_new_winner_id UUID;
  v_tournament_id UUID;
  v_next_matches UUID[];
  v_match_id UUID;
  v_bracket_updated BOOLEAN := false;
  v_affected_players UUID[] := '{}';
BEGIN
  -- Get current match details
  SELECT * INTO v_match
  FROM tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Check if editor is club owner
  IF NOT EXISTS (
    SELECT 1 FROM tournaments t
    JOIN club_profiles cp ON t.club_id = cp.id
    WHERE t.id = v_match.tournament_id AND cp.user_id = p_editor_id
  ) THEN
    RETURN jsonb_build_object('error', 'Only club owners can edit scores');
  END IF;
  
  -- Store old winner
  v_old_winner_id := v_match.winner_id;
  v_tournament_id := v_match.tournament_id;
  
  -- Determine new winner
  IF p_new_player1_score > p_new_player2_score THEN
    v_new_winner_id := v_match.player1_id;
  ELSIF p_new_player2_score > p_new_player1_score THEN
    v_new_winner_id := v_match.player2_id;
  ELSE
    v_new_winner_id := NULL; -- Tie - shouldn't happen in tournament
  END IF;
  
  -- Update the match with new scores
  UPDATE tournament_matches
  SET 
    score_player1 = p_new_player1_score,
    score_player2 = p_new_player2_score,
    winner_id = v_new_winner_id,
    score_edited_by = p_editor_id,
    score_edit_count = COALESCE(score_edit_count, 0) + 1,
    last_score_edit = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Score updated successfully',
    'bracket_updated', v_bracket_updated,
    'old_winner', v_old_winner_id,
    'new_winner', v_new_winner_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;