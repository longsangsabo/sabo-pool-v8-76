-- Sử dụng user thật có sẵn và tạo layout thẳng hàng
DELETE FROM tournament_results WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b';

-- Tạo 16 kết quả giải đấu với user thật có sẵn
INSERT INTO tournament_results (
  tournament_id, user_id, position, 
  matches_played, matches_won, matches_lost,
  points_earned, elo_points_earned, prize_money, physical_rewards
) VALUES 
-- Top 16 với user thật
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'd7d6ce12-490f-4fff-b913-80044de5e169', 1, 7, 7, 0, 1000, 100, 2000000, '["Cúp vô địch", "Huy chương vàng", "Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '519cf7c9-e112-40b2-9e4d-0cd44783ec9e', 2, 7, 6, 1, 700, 50, 1000000, '["Huy chương bạc", "Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2', 3, 6, 5, 1, 500, 25, 500000, '["Huy chương đồng", "Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '0e541971-640e-4a5e-881b-b7f98a2904f7', 4, 6, 4, 2, 300, 10, 50000, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '9f5c350d-5ee2-4aa4-bd1e-e1ac2ed57e6a', 5, 5, 4, 1, 300, 10, 50000, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '46bfe678-66cf-48a9-8bc8-d2eee8274ac3', 6, 5, 3, 2, 300, 10, 50000, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'ece1b398-9107-4ed6-ba30-6c3b7d725b0b', 7, 5, 3, 2, 300, 10, 50000, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '630730f6-6a4c-4e91-aab3-ce9bdc92057b', 8, 5, 2, 3, 300, 10, 50000, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '1b20b730-51f7-4a58-9d14-ca168a51be99', 9, 4, 2, 2, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'f271ced4-12e2-4643-8123-1a65df65acf8', 10, 4, 2, 2, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb);

-- Thêm 6 kết quả nữa bằng cách lặp lại user (vì chỉ có 10 user)
INSERT INTO tournament_results (
  tournament_id, user_id, position, 
  matches_played, matches_won, matches_lost,
  points_earned, elo_points_earned, prize_money, physical_rewards
) VALUES 
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'd7d6ce12-490f-4fff-b913-80044de5e169', 11, 3, 1, 2, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '519cf7c9-e112-40b2-9e4d-0cd44783ec9e', 12, 3, 1, 2, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2', 13, 3, 0, 3, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '0e541971-640e-4a5e-881b-b7f98a2904f7', 14, 3, 0, 3, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '9f5c350d-5ee2-4aa4-bd1e-e1ac2ed57e6a', 15, 2, 0, 2, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '46bfe678-66cf-48a9-8bc8-d2eee8274ac3', 16, 2, 0, 2, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb)
ON CONFLICT (tournament_id, user_id) DO UPDATE SET
  position = EXCLUDED.position,
  matches_played = EXCLUDED.matches_played,
  matches_won = EXCLUDED.matches_won,
  matches_lost = EXCLUDED.matches_lost,
  points_earned = EXCLUDED.points_earned,
  elo_points_earned = EXCLUDED.elo_points_earned,
  prize_money = EXCLUDED.prize_money,
  physical_rewards = EXCLUDED.physical_rewards;

-- Cập nhật avatar cho tất cả user
UPDATE profiles SET 
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || REPLACE(full_name, ' ', '') || '&backgroundColor=' ||
    CASE (user_id::text || 'seed')::text % 7
      WHEN 0 THEN 'ffd93d'  -- yellow
      WHEN 1 THEN 'ff6b6b'  -- red
      WHEN 2 THEN '4ecdc4'  -- cyan
      WHEN 3 THEN '45b7d1'  -- blue
      WHEN 4 THEN '96ceb4'  -- green
      WHEN 5 THEN 'ffeaa7'  -- light yellow
      ELSE 'dda0dd'         -- plum
    END,
  display_name = COALESCE(display_name, full_name)
WHERE user_id IN (
  'd7d6ce12-490f-4fff-b913-80044de5e169',
  '519cf7c9-e112-40b2-9e4d-0cd44783ec9e',
  '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2',
  '0e541971-640e-4a5e-881b-b7f98a2904f7',
  '9f5c350d-5ee2-4aa4-bd1e-e1ac2ed57e6a',
  '46bfe678-66cf-48a9-8bc8-d2eee8274ac3',
  'ece1b398-9107-4ed6-ba30-6c3b7d725b0b',
  '630730f6-6a4c-4e91-aab3-ce9bdc92057b',
  '1b20b730-51f7-4a58-9d14-ca168a51be99',
  'f271ced4-12e2-4643-8123-1a65df65acf8'
);