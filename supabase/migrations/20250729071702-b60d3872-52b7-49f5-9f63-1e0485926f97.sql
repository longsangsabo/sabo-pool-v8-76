-- Fix GROUP BY issue trong auto_advance_to_semifinal function
CREATE OR REPLACE FUNCTION auto_advance_to_semifinal(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_winner_bracket_winners UUID[];
  v_loser_branch_a_winner UUID;
  v_loser_branch_b_winner UUID;
  v_semifinal_count INTEGER;
  v_winners_final_completed INTEGER;
  v_branch_a_completed INTEGER;
  v_branch_b_completed INTEGER;
BEGIN
  -- Kiểm tra xem đã có semifinal matches chưa
  SELECT COUNT(*) INTO v_semifinal_count
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
    AND round_number = 250
    AND bracket_type != 'losers'
    AND NOT COALESCE(is_third_place_match, false)
    AND status != 'cancelled';
    
  -- Nếu đã có 2 semifinal matches, không cần tạo thêm
  IF v_semifinal_count >= 2 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Semifinal matches already exist',
      'semifinal_matches', v_semifinal_count
    );
  END IF;
  
  -- Kiểm tra Winner's Bracket Final completed (Round 3)
  SELECT COUNT(*) INTO v_winners_final_completed
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
    AND round_number = 3
    AND bracket_type = 'winners'
    AND status = 'completed'
    AND winner_id IS NOT NULL;
    
  -- Kiểm tra Loser Branch A Final completed (Round 103)
  SELECT COUNT(*) INTO v_branch_a_completed
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
    AND round_number = 103
    AND bracket_type = 'losers'
    AND match_stage = 'losers_branch_a'
    AND status = 'completed'
    AND winner_id IS NOT NULL;
    
  -- Kiểm tra Loser Branch B Final completed (Round 202)
  SELECT COUNT(*) INTO v_branch_b_completed
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
    AND round_number = 202
    AND bracket_type = 'losers'
    AND match_stage = 'losers_branch_b'
    AND status = 'completed'
    AND winner_id IS NOT NULL;
  
  -- Cần có ít nhất 2 winners từ Winner's Bracket và 2 winners từ Loser's Branches
  IF v_winners_final_completed < 2 OR v_branch_a_completed < 1 OR v_branch_b_completed < 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Not all prerequisite matches completed',
      'winners_final_completed', v_winners_final_completed,
      'branch_a_completed', v_branch_a_completed,
      'branch_b_completed', v_branch_b_completed
    );
  END IF;
  
  -- Lấy 2 winners từ Winner's Bracket (Round 3) - FIX: thêm match_number vào ORDER BY
  WITH winners_ordered AS (
    SELECT winner_id, match_number
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id
      AND round_number = 3
      AND bracket_type = 'winners'
      AND status = 'completed'
      AND winner_id IS NOT NULL
    ORDER BY match_number
  )
  SELECT array_agg(winner_id) INTO v_winner_bracket_winners FROM winners_ordered;
  
  -- Lấy winner từ Loser Branch A (Round 103)
  SELECT winner_id INTO v_loser_branch_a_winner
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
    AND round_number = 103
    AND bracket_type = 'losers'
    AND match_stage = 'losers_branch_a'
    AND status = 'completed'
    AND winner_id IS NOT NULL
  LIMIT 1;
  
  -- Lấy winner từ Loser Branch B (Round 202)
  SELECT winner_id INTO v_loser_branch_b_winner
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
    AND round_number = 202
    AND bracket_type = 'losers'
    AND match_stage = 'losers_branch_b'
    AND status = 'completed'
    AND winner_id IS NOT NULL
  LIMIT 1;
  
  -- Cancel existing wrong semifinal matches
  UPDATE tournament_matches 
  SET status = 'cancelled', updated_at = NOW()
  WHERE tournament_id = p_tournament_id
    AND round_number = 250;
  
  -- Tạo 2 semifinal matches theo chuẩn mới
  -- Semifinal 1: Winner's Bracket Winner 1 vs Loser Branch A Winner
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, match_stage,
    player1_id, player2_id, status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 250, 1, 'semifinal', 'semifinal',
    v_winner_bracket_winners[1], v_loser_branch_a_winner, 'scheduled', NOW(), NOW()
  );
  
  -- Semifinal 2: Winner's Bracket Winner 2 vs Loser Branch B Winner  
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, match_stage,
    player1_id, player2_id, status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 250, 2, 'semifinal', 'semifinal',
    v_winner_bracket_winners[2], v_loser_branch_b_winner, 'scheduled', NOW(), NOW()
  );
  
  -- Log automation
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    p_tournament_id, 'semifinal_advancement', 'completed',
    jsonb_build_object(
      'winners_bracket_winners', v_winner_bracket_winners,
      'loser_branch_a_winner', v_loser_branch_a_winner,
      'loser_branch_b_winner', v_loser_branch_b_winner,
      'semifinal_matches_created', 2
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Semifinal matches created successfully',
    'winners_bracket_winners', v_winner_bracket_winners,
    'loser_branch_a_winner', v_loser_branch_a_winner,
    'loser_branch_b_winner', v_loser_branch_b_winner,
    'semifinal_matches_created', 2
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;