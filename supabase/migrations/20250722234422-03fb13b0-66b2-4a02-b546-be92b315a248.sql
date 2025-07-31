-- Sửa lỗi tiến vòng tự động cho tournament SABO1
-- Cập nhật trận bán kết 1 để thêm "Vũ Nam Khoa" vào player1
UPDATE tournament_matches 
SET player1_id = 'f271ced4-12e2-4643-8123-1a65df65acf8',
    status = 'scheduled',
    updated_at = NOW()
WHERE tournament_id = '3a0e4174-99de-44e0-b1f4-67fd7bf37259'
  AND round_number = 3
  AND match_number = 1;

-- Cập nhật trận chung kết để thêm winner của bán kết 1 vào player1
-- Vì bán kết 1 chưa diễn ra nên chưa có winner, ta chỉ cần đặt lại status
UPDATE tournament_matches 
SET status = 'pending',
    updated_at = NOW()
WHERE tournament_id = '3a0e4174-99de-44e0-b1f4-67fd7bf37259'
  AND round_number = 4
  AND match_number = 1;

-- Tạo function để fix bracket progression tự động
CREATE OR REPLACE FUNCTION fix_bracket_progression()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fixed_matches INTEGER := 0;
  v_match RECORD;
  v_next_match RECORD;
  v_winner_id UUID;
  v_next_round_match_number INTEGER;
  v_slot_position TEXT;
BEGIN
  -- Tìm tất cả các trận đã hoàn thành nhưng winner chưa được tiến vòng
  FOR v_match IN 
    SELECT tm.id, tm.tournament_id, tm.round_number, tm.match_number, 
           tm.winner_id, tm.status
    FROM tournament_matches tm
    JOIN tournaments t ON tm.tournament_id = t.id
    WHERE tm.status = 'completed' 
      AND tm.winner_id IS NOT NULL
      AND t.status IN ('ongoing', 'registration_closed', 'completed')
    ORDER BY tm.tournament_id, tm.round_number, tm.match_number
  LOOP
    -- Tính toán vị trí tiến vòng
    v_next_round_match_number := CEIL(v_match.match_number::DECIMAL / 2);
    v_slot_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1' ELSE 'player2' END;
    
    -- Tìm trận đấu vòng tiếp theo
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND round_number = v_match.round_number + 1
      AND match_number = v_next_round_match_number;
    
    -- Kiểm tra xem winner đã được tiến vòng đúng chưa
    IF v_next_match.id IS NOT NULL THEN
      IF v_slot_position = 'player1' AND v_next_match.player1_id != v_match.winner_id THEN
        -- Cập nhật player1
        UPDATE tournament_matches
        SET player1_id = v_match.winner_id,
            status = CASE 
              WHEN player2_id IS NOT NULL THEN 'scheduled'
              ELSE 'pending'
            END,
            updated_at = NOW()
        WHERE id = v_next_match.id;
        
        v_fixed_matches := v_fixed_matches + 1;
        
      ELSIF v_slot_position = 'player2' AND v_next_match.player2_id != v_match.winner_id THEN
        -- Cập nhật player2
        UPDATE tournament_matches
        SET player2_id = v_match.winner_id,
            status = CASE 
              WHEN player1_id IS NOT NULL THEN 'scheduled'
              ELSE 'pending'
            END,
            updated_at = NOW()
        WHERE id = v_next_match.id;
        
        v_fixed_matches := v_fixed_matches + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'fixed_matches', v_fixed_matches,
    'message', 'Bracket progression fixed successfully'
  );
END;
$$;

-- Chạy function fix
SELECT fix_bracket_progression();