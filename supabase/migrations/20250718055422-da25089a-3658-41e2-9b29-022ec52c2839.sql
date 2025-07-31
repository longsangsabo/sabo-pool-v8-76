-- Fix tournament completion với đúng user_ids từ database

-- 1. Cập nhật tournament status
UPDATE public.tournaments 
SET 
  status = 'completed',
  completed_at = now(),
  updated_at = now()
WHERE id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';

-- 2. Xóa dữ liệu cũ nếu có
DELETE FROM public.tournament_results 
WHERE tournament_id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';

DELETE FROM public.spa_points_log 
WHERE source_id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d' 
AND source_type = 'tournament';

-- 3. Tạo kết quả đúng với user_ids thực tế
WITH reward_calculations AS (
  SELECT 
    user_id,
    position,
    position_name,
    spa_points,
    prize_money
  FROM (
    VALUES 
    -- 1. Vô địch: Long SAng (winner trận chung kết)
    ('dc6705c7-6261-4caf-8f1b-2ec23ba87f05'::uuid, 1, 'Vô địch', 1500, 5000000),
    -- 2. Á quân: dfgdfgd (loser trận chung kết)
    ('91932bd8-0f2f-492b-bc52-946d83aece06'::uuid, 2, 'Á quân', 1000, 3000000),
    -- 3. Hạng 3: Club Owner 1752123983738 (winner tranh hạng 3)
    ('570f94dd-91f1-4f43-9ad3-6f152db91f67'::uuid, 3, 'Hạng 3', 700, 2000000),
    -- 4. Hạng 4: Club Owner 1752123983536 (loser tranh hạng 3)
    ('c1ee98ea-db15-4a29-9947-09cd5ad6a600'::uuid, 4, 'Hạng 4', 500, 1000000)
  ) AS t(user_id, position, position_name, spa_points, prize_money)
)

-- Insert tournament_results
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
  rc.user_id,
  rc.position,
  rc.spa_points,
  rc.prize_money,
  CASE rc.position 
    WHEN 1 THEN 50   -- Vô địch +50 ELO
    WHEN 2 THEN 30   -- Á quân +30 ELO
    WHEN 3 THEN 20   -- Hạng 3 +20 ELO
    WHEN 4 THEN 10   -- Hạng 4 +10 ELO
    ELSE 5
  END,
  4, -- 4 trận đấu
  CASE rc.position
    WHEN 1 THEN 4    -- Vô địch thắng 4/4
    WHEN 2 THEN 3    -- Á quân thắng 3/4
    WHEN 3 THEN 3    -- Hạng 3 thắng 3/4
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

-- 4. Award SPA points
INSERT INTO public.spa_points_log (
  user_id,
  source_type,
  source_id,
  points_earned,
  description,
  created_at
)
SELECT 
  rc.user_id,
  'tournament',
  '727a8ae8-0598-47bf-b305-2fc2bc60b57d'::uuid,
  rc.spa_points,
  format('Tournament Test Tournament - %s', rc.position_name),
  now()
FROM reward_calculations rc;

-- 5. Cập nhật player rankings
INSERT INTO public.player_rankings (
  user_id, 
  spa_points, 
  total_matches, 
  tournament_wins,
  updated_at
)
SELECT 
  rc.user_id,
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