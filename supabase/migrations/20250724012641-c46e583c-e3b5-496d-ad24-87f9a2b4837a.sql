-- Tạo function để tạo kết quả giải đấu manual
CREATE OR REPLACE FUNCTION public.force_generate_tournament_results(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_results_created INTEGER := 0;
  v_final_match RECORD;
  v_champion_id UUID;
  v_runner_up_id UUID;
BEGIN
  -- Lấy thông tin giải đấu
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Xóa kết quả cũ nếu có
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Tìm trận chung kết
  SELECT * INTO v_final_match
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = (SELECT MAX(round_number) FROM tournament_matches WHERE tournament_id = p_tournament_id)
    AND match_number = 1
    AND status = 'completed'
    AND winner_id IS NOT NULL;
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Final match not found or not completed');
  END IF;
  
  v_champion_id := v_final_match.winner_id;
  v_runner_up_id := CASE 
    WHEN v_final_match.player1_id = v_champion_id THEN v_final_match.player2_id 
    ELSE v_final_match.player1_id 
  END;
  
  -- Tạo kết quả cho tất cả người tham gia
  WITH participant_stats AS (
    SELECT 
      tr.user_id,
      COUNT(tm.id) FILTER (WHERE (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) AND tm.status = 'completed') as total_matches,
      COUNT(tm.id) FILTER (WHERE tm.winner_id = tr.user_id) as wins,
      COUNT(tm.id) FILTER (WHERE (tm.player1_id = tr.user_id OR tm.player2_id = tr.user_id) AND tm.status = 'completed' AND tm.winner_id != tr.user_id) as losses
    FROM tournament_registrations tr
    LEFT JOIN tournament_matches tm ON tm.tournament_id = tr.tournament_id
    WHERE tr.tournament_id = p_tournament_id 
      AND tr.registration_status = 'confirmed'
    GROUP BY tr.user_id
  ),
  position_assigned AS (
    SELECT 
      ps.*,
      CASE 
        WHEN ps.user_id = v_champion_id THEN 1
        WHEN ps.user_id = v_runner_up_id THEN 2
        ELSE ROW_NUMBER() OVER (ORDER BY ps.wins DESC, ps.losses ASC) + 2
      END as final_position,
      CASE 
        WHEN ps.total_matches > 0 THEN ROUND((ps.wins::numeric / ps.total_matches::numeric) * 100, 2)
        ELSE 0
      END as win_percentage
    FROM participant_stats ps
  )
  INSERT INTO tournament_results (
    tournament_id, user_id, final_position,
    total_matches, wins, losses, win_percentage,
    spa_points_earned, elo_points_awarded, prize_amount
  )
  SELECT 
    p_tournament_id,
    pa.user_id,
    pa.final_position,
    pa.total_matches,
    pa.wins,
    pa.losses,
    pa.win_percentage,
    CASE pa.final_position
      WHEN 1 THEN 1500  -- Vô địch
      WHEN 2 THEN 1000  -- Á quân
      WHEN 3 THEN 700   -- Hạng 3
      WHEN 4 THEN 500   -- Hạng 4
      ELSE 200          -- Các hạng khác
    END as spa_points,
    CASE pa.final_position
      WHEN 1 THEN 100   -- Vô địch ELO
      WHEN 2 THEN 50    -- Á quân ELO
      WHEN 3 THEN 30    -- Hạng 3 ELO
      WHEN 4 THEN 20    -- Hạng 4 ELO
      ELSE 10           -- Các hạng khác ELO
    END as elo_points,
    CASE pa.final_position
      WHEN 1 THEN 5000000   -- Tiền thưởng vô địch
      WHEN 2 THEN 3000000   -- Tiền thưởng á quân
      WHEN 3 THEN 2000000   -- Tiền thưởng hạng 3
      WHEN 4 THEN 1000000   -- Tiền thưởng hạng 4
      ELSE 0                -- Không có tiền thưởng
    END as prize_money
  FROM position_assigned pa;
  
  GET DIAGNOSTICS v_results_created = ROW_COUNT;
  
  -- Cập nhật ranking cho players
  UPDATE player_rankings pr
  SET spa_points = pr.spa_points + tr.spa_points_earned,
      elo_points = pr.elo_points + tr.elo_points_awarded,
      updated_at = NOW()
  FROM tournament_results tr
  WHERE tr.tournament_id = p_tournament_id 
    AND tr.user_id = pr.user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'results_created', v_results_created,
    'champion_id', v_champion_id,
    'runner_up_id', v_runner_up_id,
    'message', 'Tournament results generated manually'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to generate tournament results: ' || SQLERRM
    );
END;
$$;

-- Kiểm tra và sửa trigger auto completion 
DROP TRIGGER IF EXISTS trigger_auto_complete_tournament_results ON tournaments;

CREATE TRIGGER trigger_auto_complete_tournament_results
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.auto_complete_tournament_results();

-- Chạy manual cho giải "dqdq1" 
SELECT public.force_generate_tournament_results('acddc309-6ab0-4da3-9243-d678ea46c091');