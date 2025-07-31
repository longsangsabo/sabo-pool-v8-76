-- Khôi phục triggers tự động cho V9 double elimination system

-- 1. Trigger tự động advance khi có winner
CREATE OR REPLACE TRIGGER auto_advance_double_elimination_v9
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  WHEN (NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id))
  EXECUTE FUNCTION public.trigger_advance_double_elimination_v9();

-- 2. Trigger thông báo real-time cho winner advancement
CREATE OR REPLACE TRIGGER notify_winner_advancement_v9
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  WHEN (NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id))
  EXECUTE FUNCTION public.notify_winner_advancement();

-- 3. Trigger kiểm tra hoàn thành tournament
CREATE OR REPLACE TRIGGER check_tournament_completion_v9
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.winner_id IS NOT NULL)
  EXECUTE FUNCTION public.check_tournament_completion();

-- 4. Tạo function submit score đặc biệt cho V9 nếu chưa có
CREATE OR REPLACE FUNCTION public.submit_double_elimination_score_v9(
  p_match_id UUID,
  p_winner_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament_id UUID;
  v_result JSONB;
BEGIN
  -- Get match details
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  v_tournament_id := v_match.tournament_id;
  
  -- Update match with score and winner
  UPDATE tournament_matches 
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = p_winner_id,
    status = 'completed',
    actual_end_time = NOW(),
    score_input_by = auth.uid(),
    score_submitted_at = NOW(),
    score_status = 'confirmed',
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Check if this is final match
  DECLARE
    v_is_final_match BOOLEAN;
    v_tournament_completed BOOLEAN := FALSE;
  BEGIN
    SELECT EXISTS(
      SELECT 1 FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
      AND match_stage = 'finals'
      AND id = p_match_id
    ) INTO v_is_final_match;
    
    -- If final match completed, mark tournament as completed
    IF v_is_final_match THEN
      UPDATE tournaments 
      SET status = 'completed', completed_at = NOW()
      WHERE id = v_tournament_id;
      v_tournament_completed := TRUE;
    END IF;
  END;
  
  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', p_winner_id,
    'loser_id', CASE WHEN v_match.player1_id = p_winner_id THEN v_match.player2_id ELSE v_match.player1_id END,
    'submitted_at', NOW(),
    'is_final_match', v_is_final_match,
    'tournament_completed', v_tournament_completed
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', 'Score submission failed: ' || SQLERRM);
END;
$$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION public.submit_double_elimination_score_v9 TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_double_elimination_v9 TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_advance_double_elimination_v9 TO authenticated;