-- Fix tournament completion - separated queries

-- 1. Cập nhật tournament status thành completed
UPDATE public.tournaments 
SET 
  status = 'completed',
  completed_at = now(),
  updated_at = now()
WHERE id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';

-- 2. Xóa dữ liệu cũ
DELETE FROM public.tournament_results 
WHERE tournament_id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';

DELETE FROM public.spa_points_log 
WHERE source_id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d' 
AND source_type = 'tournament';

-- 3. Insert tournament_results cho từng vị trí
-- Vô địch: Long SAng
INSERT INTO public.tournament_results (
  tournament_id, user_id, final_position, spa_points_earned, prize_money, 
  elo_points_earned, matches_played, matches_won, matches_lost, created_at
) VALUES (
  '727a8ae8-0598-47bf-b305-2fc2bc60b57d'::uuid,
  'dc6705c7-6261-4caf-8f1b-2ec23ba87f05'::uuid,
  1, 1500, 5000000, 50, 4, 4, 0, now()
);

-- Á quân: dfgdfgd
INSERT INTO public.tournament_results (
  tournament_id, user_id, final_position, spa_points_earned, prize_money, 
  elo_points_earned, matches_played, matches_won, matches_lost, created_at
) VALUES (
  '727a8ae8-0598-47bf-b305-2fc2bc60b57d'::uuid,
  '91932bd8-0f2f-492b-bc52-946d83aece06'::uuid,
  2, 1000, 3000000, 30, 4, 3, 1, now()
);

-- Hạng 3: Club Owner 1752123983738
INSERT INTO public.tournament_results (
  tournament_id, user_id, final_position, spa_points_earned, prize_money, 
  elo_points_earned, matches_played, matches_won, matches_lost, created_at
) VALUES (
  '727a8ae8-0598-47bf-b305-2fc2bc60b57d'::uuid,
  '570f94dd-91f1-4f43-9ad3-6f152db91f67'::uuid,
  3, 700, 2000000, 20, 4, 3, 1, now()
);

-- Hạng 4: Club Owner 1752123983536
INSERT INTO public.tournament_results (
  tournament_id, user_id, final_position, spa_points_earned, prize_money, 
  elo_points_earned, matches_played, matches_won, matches_lost, created_at
) VALUES (
  '727a8ae8-0598-47bf-b305-2fc2bc60b57d'::uuid,
  'c1ee98ea-db15-4a29-9947-09cd5ad6a600'::uuid,
  4, 500, 1000000, 10, 4, 2, 2, now()
);

-- 4. Award SPA points trong log
INSERT INTO public.spa_points_log (user_id, source_type, source_id, points_earned, description, created_at)
VALUES 
('dc6705c7-6261-4caf-8f1b-2ec23ba87f05', 'tournament', '727a8ae8-0598-47bf-b305-2fc2bc60b57d', 1500, 'Tournament Test Tournament - Vô địch', now()),
('91932bd8-0f2f-492b-bc52-946d83aece06', 'tournament', '727a8ae8-0598-47bf-b305-2fc2bc60b57d', 1000, 'Tournament Test Tournament - Á quân', now()),
('570f94dd-91f1-4f43-9ad3-6f152db91f67', 'tournament', '727a8ae8-0598-47bf-b305-2fc2bc60b57d', 700, 'Tournament Test Tournament - Hạng 3', now()),
('c1ee98ea-db15-4a29-9947-09cd5ad6a600', 'tournament', '727a8ae8-0598-47bf-b305-2fc2bc60b57d', 500, 'Tournament Test Tournament - Hạng 4', now());

-- 5. Cập nhật player rankings
-- Vô địch
INSERT INTO public.player_rankings (user_id, spa_points, total_matches, tournament_wins, updated_at)
VALUES ('dc6705c7-6261-4caf-8f1b-2ec23ba87f05', 1500, 1, 1, now())
ON CONFLICT (user_id) DO UPDATE SET
  spa_points = COALESCE(player_rankings.spa_points, 0) + 1500,
  total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
  tournament_wins = COALESCE(player_rankings.tournament_wins, 0) + 1,
  updated_at = now();

-- Á quân  
INSERT INTO public.player_rankings (user_id, spa_points, total_matches, tournament_wins, updated_at)
VALUES ('91932bd8-0f2f-492b-bc52-946d83aece06', 1000, 1, 0, now())
ON CONFLICT (user_id) DO UPDATE SET
  spa_points = COALESCE(player_rankings.spa_points, 0) + 1000,
  total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
  updated_at = now();

-- Hạng 3
INSERT INTO public.player_rankings (user_id, spa_points, total_matches, tournament_wins, updated_at)
VALUES ('570f94dd-91f1-4f43-9ad3-6f152db91f67', 700, 1, 0, now())
ON CONFLICT (user_id) DO UPDATE SET
  spa_points = COALESCE(player_rankings.spa_points, 0) + 700,
  total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
  updated_at = now();

-- Hạng 4
INSERT INTO public.player_rankings (user_id, spa_points, total_matches, tournament_wins, updated_at)
VALUES ('c1ee98ea-db15-4a29-9947-09cd5ad6a600', 500, 1, 0, now())
ON CONFLICT (user_id) DO UPDATE SET
  spa_points = COALESCE(player_rankings.spa_points, 0) + 500,
  total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
  updated_at = now();