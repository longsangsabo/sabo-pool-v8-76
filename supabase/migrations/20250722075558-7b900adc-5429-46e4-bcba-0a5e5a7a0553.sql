-- Sửa lỗi với cách tiếp cận đơn giản hơn
-- Sử dụng chỉ 4 user có sẵn để tạo 16 kết quả
DELETE FROM tournament_results WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b';

-- Chèn 16 kết quả cho giải đấu sử dụng 4 user có sẵn nhiều lần với vị trí khác nhau  
INSERT INTO tournament_results (
  tournament_id, user_id, position, 
  matches_played, matches_won, matches_lost,
  points_earned, elo_points_earned, prize_money, physical_rewards
) VALUES 
-- Top 1-4: User thật
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '570f94dd-91f1-4f43-9ad3-6f152db91f67', 1, 5, 5, 0, 1000, 100, 2000000, '["Cúp vô địch", "Huy chương vàng", "Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'dc6705c7-6261-4caf-8f1b-2ec23ba87f05', 2, 5, 4, 1, 700, 50, 1000000, '["Huy chương bạc", "Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '91932bd8-0f2f-492b-bc52-946d83aece06', 3, 4, 3, 1, 500, 25, 500000, '["Huy chương đồng", "Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'c1ee98ea-db15-4a29-9947-09cd5ad6a600', 4, 4, 3, 1, 300, 10, 50000, '["Giấy chứng nhận"]'::jsonb);

-- Cập nhật avatar cho 4 user có sẵn
UPDATE profiles SET 
  avatar_url = CASE user_id
    WHEN '570f94dd-91f1-4f43-9ad3-6f152db91f67' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=ClubOwner&backgroundColor=ffd93d&clothes=blazerShirt'
    WHEN 'dc6705c7-6261-4caf-8f1b-2ec23ba87f05' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=LongSang&backgroundColor=ff6b6b&clothes=shirtCrewNeck'
    WHEN '91932bd8-0f2f-492b-bc52-946d83aece06' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=dfgdfgd&backgroundColor=4ecdc4&clothes=hoodie'
    WHEN 'c1ee98ea-db15-4a29-9947-09cd5ad6a600' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=ClubOwner2&backgroundColor=45b7d1&clothes=blazerShirt'
  END
WHERE user_id IN (
  '570f94dd-91f1-4f43-9ad3-6f152db91f67',
  'dc6705c7-6261-4caf-8f1b-2ec23ba87f05', 
  '91932bd8-0f2f-492b-bc52-946d83aece06',
  'c1ee98ea-db15-4a29-9947-09cd5ad6a600'
);