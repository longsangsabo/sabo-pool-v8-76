
-- 1. Kiểm tra và loại bỏ các trigger có vấn đề
-- Tạm thời vô hiệu hóa trigger auto-advance để tránh lỗi
DROP TRIGGER IF EXISTS trigger_auto_advance_winner ON public.tournament_matches;
DROP TRIGGER IF EXISTS trigger_advance_tournament_winner ON public.tournament_matches;

-- 2. Tạo function cải tiến để phát hiện final match chính xác
CREATE OR REPLACE FUNCTION public.is_final_match(p_match_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
  v_max_round INTEGER;
  v_total_matches INTEGER;
  v_completed_matches INTEGER;
BEGIN
  -- Lấy thông tin match
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN false;
  END IF;
  
  -- Lấy round cao nhất trong tournament
  SELECT MAX(round_number) INTO v_max_round
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id;
  
  -- Kiểm tra nếu đây là match cuối cùng của round cuối
  IF v_match.round_number = v_max_round AND v_match.match_number = 1 THEN
    -- Đảm bảo không phải third place match
    IF v_match.is_third_place_match IS NULL OR v_match.is_third_place_match = false THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- 3. Cải thiện function update_match_score_safe để xử lý final match tốt hơn
CREATE OR REPLACE FUNCTION public.update_match_score_safe(
  p_match_id uuid,
  p_player1_score integer,
  p_player2_score integer,
  p_submitted_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_winner_id UUID;
  v_match RECORD;
  v_is_final boolean;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
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
  
  -- Check if this is final match
  SELECT public.is_final_match(p_match_id) INTO v_is_final;
  
  -- Update match với score và winner
  UPDATE tournament_matches
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Nếu là final match, cập nhật tournament status
  IF v_is_final THEN
    UPDATE tournaments 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    RAISE NOTICE 'Tournament % completed with champion %', v_match.tournament_id, v_winner_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', v_winner_id,
    'match_id', p_match_id,
    'player1_score', p_player1_score,
    'player2_score', p_player2_score,
    'is_final_match', v_is_final,
    'tournament_completed', v_is_final
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating match score: %', SQLERRM;
    RETURN jsonb_build_object(
      'error', format('Failed to update match score: %s', SQLERRM)
    );
END;
$$;

-- 4. Tạo function advancement riêng biệt (không có lỗi tournament_wins)
CREATE OR REPLACE FUNCTION public.advance_winner_safe(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_match RECORD;
  v_next_match RECORD;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_is_player1_slot BOOLEAN;
  v_max_rounds INTEGER;
BEGIN
  -- Get completed match details
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id 
    AND status = 'completed'
    AND winner_id IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found or not completed');
  END IF;
  
  -- Calculate next round and match position
  v_next_round := v_match.round_number + 1;
  v_next_match_number := CEIL(v_match.match_number::NUMERIC / 2);
  
  -- Get max rounds for this tournament
  SELECT MAX(round_number) INTO v_max_rounds
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id;
  
  -- Check if this was the final match
  IF v_match.round_number >= v_max_rounds THEN
    RETURN jsonb_build_object(
      'success', true,
      'tournament_complete', true,
      'champion_id', v_match.winner_id
    );
  END IF;
  
  -- Find next round match
  SELECT * INTO v_next_match
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id 
    AND round_number = v_next_round 
    AND match_number = v_next_match_number;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Next round match not found');
  END IF;
  
  -- Determine slot position
  v_is_player1_slot := (v_match.match_number % 2 = 1);
  
  -- Advance winner to appropriate slot
  IF v_is_player1_slot THEN
    UPDATE tournament_matches 
    SET player1_id = v_match.winner_id,
        status = CASE 
          WHEN player2_id IS NOT NULL THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = v_match.winner_id,
        status = CASE 
          WHEN player1_id IS NOT NULL THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'advanced_to_round', v_next_round,
    'advanced_to_match', v_next_match_number,
    'winner_id', v_match.winner_id,
    'slot', CASE WHEN v_is_player1_slot THEN 'player1' ELSE 'player2' END
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM
    );
END;
$$;
