-- Tạo kết quả giải đấu new1 và cập nhật status
DO $$
DECLARE
  v_tournament_id UUID;
  v_champion_id UUID := 'd7d6ce12-490f-4fff-b913-80044de5e169'; -- Anh Long
  v_runner_up_id UUID := '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2'; -- Phan Thị Bình
  v_position INT := 3;
  v_participant RECORD;
BEGIN
  -- Get tournament ID
  SELECT id INTO v_tournament_id FROM tournaments WHERE name ILIKE '%new1%' LIMIT 1;
  
  -- Delete existing results if any
  DELETE FROM tournament_results WHERE tournament_id = v_tournament_id;
  
  -- 1st Place - Champion (Anh Long)
  INSERT INTO tournament_results (
    tournament_id, user_id, final_position, 
    matches_played, matches_won, matches_lost, win_percentage,
    spa_points_earned, elo_points_earned, prize_amount, 
    placement_type, created_at, updated_at
  ) VALUES (
    v_tournament_id, v_champion_id, 1,
    (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = v_tournament_id AND (player1_id = v_champion_id OR player2_id = v_champion_id) AND status = 'completed'),
    (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = v_tournament_id AND winner_id = v_champion_id),
    (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = v_tournament_id AND (player1_id = v_champion_id OR player2_id = v_champion_id) AND status = 'completed' AND winner_id != v_champion_id),
    0, -- Will be calculated
    1500, 100, 5000000,
    'final', NOW(), NOW()
  );
  
  -- 2nd Place - Runner-up (Phan Thị Bình) 
  INSERT INTO tournament_results (
    tournament_id, user_id, final_position,
    matches_played, matches_won, matches_lost, win_percentage,
    spa_points_earned, elo_points_earned, prize_amount,
    placement_type, created_at, updated_at
  ) VALUES (
    v_tournament_id, v_runner_up_id, 2,
    (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = v_tournament_id AND (player1_id = v_runner_up_id OR player2_id = v_runner_up_id) AND status = 'completed'),
    (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = v_tournament_id AND winner_id = v_runner_up_id),
    (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = v_tournament_id AND (player1_id = v_runner_up_id OR player2_id = v_runner_up_id) AND status = 'completed' AND winner_id != v_runner_up_id),
    0, -- Will be calculated
    1000, 75, 3000000,
    'final', NOW(), NOW()
  );
  
  -- Add other participants (3rd place and beyond)
  FOR v_participant IN
    SELECT DISTINCT user_id 
    FROM tournament_registrations 
    WHERE tournament_id = v_tournament_id 
    AND registration_status = 'confirmed'
    AND user_id NOT IN (v_champion_id, v_runner_up_id)
  LOOP
    INSERT INTO tournament_results (
      tournament_id, user_id, final_position,
      matches_played, matches_won, matches_lost, win_percentage,
      spa_points_earned, elo_points_earned, prize_amount,
      placement_type, created_at, updated_at
    ) VALUES (
      v_tournament_id, v_participant.user_id, v_position,
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = v_tournament_id AND (player1_id = v_participant.user_id OR player2_id = v_participant.user_id) AND status = 'completed'),
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = v_tournament_id AND winner_id = v_participant.user_id),
      (SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = v_tournament_id AND (player1_id = v_participant.user_id OR player2_id = v_participant.user_id) AND status = 'completed' AND winner_id != v_participant.user_id),
      0, -- Will be calculated
      CASE WHEN v_position = 3 THEN 700 WHEN v_position = 4 THEN 500 ELSE 200 END,
      CASE WHEN v_position = 3 THEN 50 WHEN v_position = 4 THEN 30 ELSE 10 END,
      CASE WHEN v_position = 3 THEN 2000000 WHEN v_position = 4 THEN 1000000 ELSE 0 END,
      'elimination', NOW(), NOW()
    );
    
    v_position := v_position + 1;
  END LOOP;
  
  -- Update win percentages
  UPDATE tournament_results 
  SET win_percentage = CASE 
    WHEN matches_played > 0 THEN ROUND((matches_won::numeric / matches_played::numeric) * 100, 2)
    ELSE 0 
  END
  WHERE tournament_id = v_tournament_id;
  
  -- Update tournament status to completed
  UPDATE tournaments 
  SET status = 'completed', 
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = v_tournament_id;
  
END $$;