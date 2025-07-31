-- Bổ sung thêm user và kết quả giải đấu với avatar (sửa lỗi tên cột)
-- Xóa kết quả cũ trước
DELETE FROM tournament_results WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b';

-- Chèn 16 user với đầy đủ thông tin và avatar (sử dụng đúng tên cột)
INSERT INTO tournament_results (
  tournament_id, user_id, position, 
  matches_played, matches_won, matches_lost,
  points_earned, elo_points_earned, prize_money, physical_rewards
) VALUES 
-- Top 1 
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '570f94dd-91f1-4f43-9ad3-6f152db91f67', 1, 5, 5, 0, 1000, 100, 2000000, '["Cúp vô địch", "Huy chương vàng", "Giấy chứng nhận"]'::jsonb),

-- Top 2
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'dc6705c7-6261-4caf-8f1b-2ec23ba87f05', 2, 5, 4, 1, 700, 50, 1000000, '["Huy chương bạc", "Giấy chứng nhận"]'::jsonb),

-- Top 3
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '91932bd8-0f2f-492b-bc52-946d83aece06', 3, 4, 3, 1, 500, 25, 500000, '["Huy chương đồng", "Giấy chứng nhận"]'::jsonb),

-- Top 4-8
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'c1ee98ea-db15-4a29-9947-09cd5ad6a600', 4, 4, 3, 1, 300, 10, 50000, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '2b5e8f4a-1234-5678-9abc-def012345678', 5, 3, 2, 1, 300, 10, 50000, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '3c6f9a5b-2345-6789-abcd-ef0123456789', 6, 3, 2, 1, 300, 10, 50000, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '4d7a0b6c-3456-789a-bcde-f01234567890', 7, 3, 2, 1, 300, 10, 50000, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '5e8b1c7d-4567-89ab-cdef-012345678901', 8, 3, 1, 2, 300, 10, 50000, '["Giấy chứng nhận"]'::jsonb),

-- Top 9-16
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '6f9c2d8e-5678-9abc-def0-123456789012', 9, 2, 1, 1, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '7a0d3e9f-6789-abcd-ef01-234567890123', 10, 2, 1, 1, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '8b1e4f0a-789a-bcde-f012-345678901234', 11, 2, 1, 1, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', '9c2f5a1b-89ab-cdef-0123-456789012345', 12, 2, 1, 1, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'ad3a6b2c-9abc-def0-1234-567890123456', 13, 2, 0, 2, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'be4b7c3d-abcd-ef01-2345-678901234567', 14, 2, 0, 2, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'cf5c8d4e-bcde-f012-3456-789012345678', 15, 1, 0, 1, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 'd06d9e5f-cdef-0123-4567-890123456789', 16, 1, 0, 1, 100, 5, 0, '["Giấy chứng nhận"]'::jsonb);

-- Tạo profiles cho các user mới (nếu chưa có)
INSERT INTO profiles (user_id, full_name, display_name, avatar_url) VALUES
('2b5e8f4a-1234-5678-9abc-def012345678', 'Nguyễn Minh Tuấn', 'Minh Tuấn', 'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhTuan&backgroundColor=b6e3f4'),
('3c6f9a5b-2345-6789-abcd-ef0123456789', 'Trần Thị Hương', 'Thị Hương', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThiHuong&backgroundColor=ffaaa5'),
('4d7a0b6c-3456-789a-bcde-f01234567890', 'Lê Văn Hiếu', 'Văn Hiếu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=VanHieu&backgroundColor=c7ecee'),
('5e8b1c7d-4567-89ab-cdef-012345678901', 'Phạm Thị Lan', 'Thị Lan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThiLan&backgroundColor=dda0dd'),
('6f9c2d8e-5678-9abc-def0-123456789012', 'Hoàng Minh Đức', 'Minh Đức', 'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhDuc&backgroundColor=98fb98'),
('7a0d3e9f-6789-abcd-ef01-234567890123', 'Ngô Thị Trang', 'Thị Trang', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThiTrang&backgroundColor=ffd700'),
('8b1e4f0a-789a-bcde-f012-345678901234', 'Đỗ Văn Thắng', 'Văn Thắng', 'https://api.dicebear.com/7.x/avataaars/svg?seed=VanThang&backgroundColor=ff8c69'),
('9c2f5a1b-89ab-cdef-0123-456789012345', 'Lý Thị Mai', 'Thị Mai', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThiMai&backgroundColor=87ceeb'),
('ad3a6b2c-9abc-def0-1234-567890123456', 'Võ Minh Khoa', 'Minh Khoa', 'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhKhoa&backgroundColor=f0e68c'),
('be4b7c3d-abcd-ef01-2345-678901234567', 'Phan Thị Phương', 'Thị Phương', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThiPhuong&backgroundColor=da70d6'),
('cf5c8d4e-bcde-f012-3456-789012345678', 'Tạ Văn Hùng', 'Văn Hùng', 'https://api.dicebear.com/7.x/avataaars/svg?seed=VanHung&backgroundColor=20b2aa'),
('d06d9e5f-cdef-0123-4567-890123456789', 'Bùi Thị Linh', 'Thị Linh', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThiLinh&backgroundColor=ffa07a')
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url;

-- Cập nhật avatar cho các user có sẵn
UPDATE profiles SET 
  avatar_url = CASE user_id
    WHEN '570f94dd-91f1-4f43-9ad3-6f152db91f67' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=ClubOwner&backgroundColor=ffd93d&clothes=blazerShirt'
    WHEN 'dc6705c7-6261-4caf-8f1b-2ec23ba87f05' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=LongSang&backgroundColor=ff6b6b&clothes=shirtCrewNeck'
    WHEN '91932bd8-0f2f-492b-bc52-946d83aece06' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=dfgdfgd&backgroundColor=4ecdc4&clothes=hoodie'
    WHEN 'c1ee98ea-db15-4a29-9947-09cd5ad6a600' THEN 'https://api.dicebear.com/7.x/avataaars/svg?seed=ClubOwner2&backgroundColor=45b7d1&clothes=blazerShirt'
    ELSE avatar_url
  END
WHERE user_id IN (
  '570f94dd-91f1-4f43-9ad3-6f152db91f67',
  'dc6705c7-6261-4caf-8f1b-2ec23ba87f05', 
  '91932bd8-0f2f-492b-bc52-946d83aece06',
  'c1ee98ea-db15-4a29-9947-09cd5ad6a600'
);