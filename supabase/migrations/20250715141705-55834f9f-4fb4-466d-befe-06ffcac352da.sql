-- Add score edit tracking columns to tournament_matches
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS score_edited_by UUID REFERENCES profiles(user_id);
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS score_edit_count INTEGER DEFAULT 0;
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS last_score_edit TIMESTAMP WITH TIME ZONE;

-- Create function to edit confirmed scores with full automation
CREATE OR REPLACE FUNCTION public.edit_confirmed_score(
  p_match_id UUID,
  p_new_player1_score INTEGER,
  p_new_player2_score INTEGER,
  p_editor_id UUID
) RETURNS jsonb
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
  
  -- If winner changed, update next round matches
  IF v_old_winner_id != v_new_winner_id THEN
    v_bracket_updated := true;
    
    -- Find next round matches that need updating
    SELECT ARRAY_AGG(id) INTO v_next_matches
    FROM tournament_matches
    WHERE tournament_id = v_tournament_id
    AND round_number = v_match.round_number + 1
    AND (player1_id = v_old_winner_id OR player2_id = v_old_winner_id);
    
    -- Update next round matches
    FOREACH v_match_id IN ARRAY v_next_matches LOOP
      UPDATE tournament_matches
      SET 
        player1_id = CASE 
          WHEN player1_id = v_old_winner_id THEN v_new_winner_id
          ELSE player1_id
        END,
        player2_id = CASE 
          WHEN player2_id = v_old_winner_id THEN v_new_winner_id
          ELSE player2_id
        END,
        -- Reset match if it was already played
        winner_id = CASE 
          WHEN status = 'completed' THEN NULL
          ELSE winner_id
        END,
        status = CASE 
          WHEN status = 'completed' THEN 'scheduled'
          ELSE status
        END,
        score_player1 = CASE 
          WHEN status = 'completed' THEN 0
          ELSE score_player1
        END,
        score_player2 = CASE 
          WHEN status = 'completed' THEN 0
          ELSE score_player2
        END,
        updated_at = NOW()
      WHERE id = v_match_id;
      
      -- Collect affected players for notifications
      v_affected_players := v_affected_players || ARRAY[
        (SELECT player1_id FROM tournament_matches WHERE id = v_match_id),
        (SELECT player2_id FROM tournament_matches WHERE id = v_match_id)
      ];
    END LOOP;
  END IF;
  
  -- Create notifications for affected players
  IF v_old_winner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, priority, metadata)
    VALUES (
      v_old_winner_id,
      'score_edited',
      'Tỷ số trận đấu đã được sửa',
      'Tỷ số trận đấu của bạn đã được BTC cập nhật lại',
      'high',
      jsonb_build_object(
        'match_id', p_match_id,
        'old_score', v_match.score_player1 || ' - ' || v_match.score_player2,
        'new_score', p_new_player1_score || ' - ' || p_new_player2_score
      )
    );
  END IF;
  
  IF v_new_winner_id IS NOT NULL AND v_new_winner_id != v_old_winner_id THEN
    INSERT INTO notifications (user_id, type, title, message, priority, metadata)
    VALUES (
      v_new_winner_id,
      'score_edited',
      'Tỷ số trận đấu đã được sửa',
      'Tỷ số trận đấu của bạn đã được BTC cập nhật lại',
      'high',
      jsonb_build_object(
        'match_id', p_match_id,
        'old_score', v_match.score_player1 || ' - ' || v_match.score_player2,
        'new_score', p_new_player1_score || ' - ' || p_new_player2_score
      )
    );
  END IF;
  
  -- Notify affected players in next rounds
  IF array_length(v_affected_players, 1) > 0 THEN
    INSERT INTO notifications (user_id, type, title, message, priority, metadata)
    SELECT 
      unnest(v_affected_players),
      'bracket_updated',
      'Bảng đấu đã được cập nhật',
      'Do thay đổi tỷ số, bảng đấu đã được cập nhật lại',
      'normal',
      jsonb_build_object('tournament_id', v_tournament_id);
  END IF;
  
  -- Log the edit action
  INSERT INTO admin_actions (
    admin_id,
    target_user_id,
    action_type,
    action_details,
    reason
  ) VALUES (
    p_editor_id,
    v_match.player1_id,
    'edit_match_score',
    jsonb_build_object(
      'match_id', p_match_id,
      'old_score', jsonb_build_object(
        'player1', v_match.score_player1,
        'player2', v_match.score_player2
      ),
      'new_score', jsonb_build_object(
        'player1', p_new_player1_score,
        'player2', p_new_player2_score
      ),
      'old_winner', v_old_winner_id,
      'new_winner', v_new_winner_id,
      'bracket_updated', v_bracket_updated
    ),
    'Score correction by club admin'
  );
  
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