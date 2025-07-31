-- Fix tournament completion logic với đúng column names

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

-- 4. Tạo kết quả đúng cho các vị trí
WITH reward_calculations AS (
  SELECT 
    player_id,
    position,
    position_name,
    spa_points,
    prize_money
  FROM (
    VALUES 
    -- Vô địch: Long SAng
    ('9ede2ddd-2b44-47e8-8f58-ad0e97c4d789'::uuid, 1, 'Vô địch', 1500, 5000000),
    -- Á quân: dfgdfgd  
    ('5e02b5eb-45c9-4bb7-9cbc-e10efac43cec'::uuid, 2, 'Á quân', 1000, 3000000),
    -- Hạng 3: Club Owner 1752123983738
    ('81bbf22f-9551-451e-b3a7-c41bb81ce8f3'::uuid, 3, 'Hạng 3', 700, 2000000),
    -- Hạng 4: Club Owner 1752123983536
    ('81bbf22f-9551-451e-b3a7-c41bb81ce8f2'::uuid, 4, 'Hạng 4', 500, 1000000)
  ) AS t(player_id, position, position_name, spa_points, prize_money)
)

-- Insert vào tournament_results với đúng column names
INSERT INTO public.tournament_results (
  tournament_id,
  user_id,
  final_position,
  spa_points_earned,
  prize_money,
  elo_points_earned,
  matches_played,
  matches_won,
  matches_lost,
  created_at
)
SELECT 
  '727a8ae8-0598-47bf-b305-2fc2bc60b57d'::uuid,
  rc.player_id,
  rc.position,
  rc.spa_points,
  rc.prize_money,
  CASE rc.position 
    WHEN 1 THEN 50   -- Vô địch +50 ELO
    WHEN 2 THEN 30   -- Á quân +30 ELO
    WHEN 3 THEN 20   -- Hạng 3 +20 ELO
    WHEN 4 THEN 10   -- Hạng 4 +10 ELO
    ELSE 5           -- Tham gia +5 ELO
  END,
  4, -- Mỗi người chơi 4 trận (1 vòng bảng + bán kết + chung kết/tranh hạng 3)
  CASE rc.position
    WHEN 1 THEN 4    -- Vô địch thắng 4/4
    WHEN 2 THEN 3    -- Á quân thắng 3/4
    WHEN 3 THEN 3    -- Hạng 3 thắng 3/4 (thắng tranh hạng 3)
    WHEN 4 THEN 2    -- Hạng 4 thắng 2/4
    ELSE 1
  END,
  CASE rc.position
    WHEN 1 THEN 0    -- Vô địch thua 0/4
    WHEN 2 THEN 1    -- Á quân thua 1/4
    WHEN 3 THEN 1    -- Hạng 3 thua 1/4 
    WHEN 4 THEN 2    -- Hạng 4 thua 2/4
    ELSE 3
  END,
  now()
FROM reward_calculations rc;

-- 5. Award SPA points trong spa_points_log
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

-- 6. Cập nhật player rankings
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