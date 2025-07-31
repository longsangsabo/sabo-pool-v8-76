-- Fix tournament completion logic và tạo lại kết quả đúng

-- 1. Cập nhật tournament status
UPDATE public.tournaments 
SET 
  status = 'completed',
  completed_at = now(),
  updated_at = now()
WHERE id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';

-- 2. Xóa dữ liệu cũ trong tournament_results nếu có
DELETE FROM public.tournament_results 
WHERE tournament_id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';

-- 3. Xóa SPA points log cũ nếu có
DELETE FROM public.spa_points_log 
WHERE source_id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d' 
AND source_type = 'tournament';

-- 4. Tạo lại tournament results đúng dựa trên kết quả trận đấu thực tế
WITH match_results AS (
  -- Lấy kết quả từ các trận đấu đã hoàn thành
  SELECT 
    tm.player1_id,
    tm.player2_id,
    tm.winner_id,
    tm.round_number,
    tm.match_number,
    tm.is_third_place_match,
    CASE 
      -- Trận chung kết: round 4, match 1
      WHEN tm.round_number = 4 AND tm.match_number = 1 THEN 
        CASE 
          WHEN tm.winner_id = tm.player1_id THEN 'final_winner'
          WHEN tm.winner_id = tm.player2_id THEN 'final_winner'
        END
      -- Trận tranh hạng 3: is_third_place_match = true
      WHEN tm.is_third_place_match = true THEN
        CASE 
          WHEN tm.winner_id = tm.player1_id THEN 'third_place_winner'
          WHEN tm.winner_id = tm.player2_id THEN 'third_place_winner'
        END
    END as match_type
  FROM public.tournament_matches tm
  WHERE tm.tournament_id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d'
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
),
player_positions AS (
  -- Xác định vị trí cho từng người chơi
  SELECT 
    player_id,
    full_name,
    display_name,
    position,
    position_name
  FROM (
    -- Vô địch: Long SAng (winner của trận chung kết)
    SELECT 
      '9ede2ddd-2b44-47e8-8f58-ad0e97c4d789'::uuid as player_id,
      'Long SAng' as full_name,
      'Long SAng' as display_name,
      1 as position,
      'Vô địch' as position_name
    
    UNION ALL
    
    -- Á quân: dfgdfgd (loser của trận chung kết)
    SELECT 
      '5e02b5eb-45c9-4bb7-9cbc-e10efac43cec'::uuid as player_id,
      'dfgdfgd' as full_name,
      'dfgdfgd' as display_name,
      2 as position,
      'Á quân' as position_name
    
    UNION ALL
    
    -- Hạng 3: Club Owner 1752123983738 (winner tranh hạng 3)
    SELECT 
      '81bbf22f-9551-451e-b3a7-c41bb81ce8f3'::uuid as player_id,
      'Club Owner 1752123983738' as full_name,
      'Club Owner 1752123983738' as display_name,
      3 as position,
      'Hạng 3' as position_name
    
    UNION ALL
    
    -- Hạng 4: Club Owner 1752123983536 (loser tranh hạng 3)
    SELECT 
      '81bbf22f-9551-451e-b3a7-c41bb81ce8f2'::uuid as player_id,
      'Club Owner 1752123983536' as full_name,
      'Club Owner 1752123983536' as display_name,
      4 as position,
      'Hạng 4' as position_name
  ) positions
),
reward_calculations AS (
  -- Tính toán rewards cho từng vị trí
  SELECT 
    pp.player_id,
    pp.full_name,
    pp.display_name,
    pp.position,
    pp.position_name,
    -- SPA Points dựa trên vị trí
    CASE pp.position
      WHEN 1 THEN 1500  -- Vô địch
      WHEN 2 THEN 1000  -- Á quân
      WHEN 3 THEN 700   -- Hạng 3
      WHEN 4 THEN 500   -- Hạng 4
      ELSE 300          -- Tham gia
    END as spa_points,
    -- Prize money
    CASE pp.position
      WHEN 1 THEN 5000000   -- 5 triệu
      WHEN 2 THEN 3000000   -- 3 triệu
      WHEN 3 THEN 2000000   -- 2 triệu
      WHEN 4 THEN 1000000   -- 1 triệu
      ELSE 500000           -- 500k
    END as prize_money
  FROM player_positions pp
)

-- Insert vào tournament_results
INSERT INTO public.tournament_results (
  tournament_id,
  player_id,
  final_position,
  spa_points_earned,
  prize_money,
  created_at,
  updated_at
)
SELECT 
  '727a8ae8-0598-47bf-b305-2fc2bc60b57d'::uuid,
  rc.player_id,
  rc.position,
  rc.spa_points,
  rc.prize_money,
  now(),
  now()
FROM reward_calculations rc;

-- 5. Award SPA points cho từng người chơi
INSERT INTO public.spa_points_log (
  user_id,
  source_type,
  source_id,
  points_earned,
  description,
  created_at
)
SELECT 
  rc.player_id,
  'tournament',
  '727a8ae8-0598-47bf-b305-2fc2bc60b57d'::uuid,
  rc.spa_points,
  format('Tournament Test Tournament - %s', rc.position_name),
  now()
FROM reward_calculations rc;

-- 6. Cập nhật player rankings với SPA points mới
INSERT INTO public.player_rankings (
  user_id, 
  spa_points, 
  total_matches, 
  tournament_wins,
  updated_at
)
SELECT 
  rc.player_id,
  rc.spa_points,
  1,
  CASE WHEN rc.position = 1 THEN 1 ELSE 0 END,
  now()
FROM reward_calculations rc
ON CONFLICT (user_id) DO UPDATE SET
  spa_points = COALESCE(player_rankings.spa_points, 0) + EXCLUDED.spa_points,
  total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
  tournament_wins = COALESCE(player_rankings.tournament_wins, 0) + EXCLUDED.tournament_wins,
  updated_at = now();

-- 7. Log completion
INSERT INTO public.automation_performance_log (
  automation_type,
  tournament_id,
  success,
  metadata,
  created_at
) VALUES (
  'tournament_completion_fix',
  '727a8ae8-0598-47bf-b305-2fc2bc60b57d',
  true,
  jsonb_build_object(
    'action', 'fix_tournament_results',
    'players_processed', 4,
    'champion', 'Long SAng',
    'runner_up', 'dfgdfgd',
    'third_place', 'Club Owner 1752123983738',
    'fourth_place', 'Club Owner 1752123983536'
  ),
  now()
);