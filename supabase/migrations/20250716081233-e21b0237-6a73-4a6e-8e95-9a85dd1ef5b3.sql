-- Tạo tournament results cho Sabo 2 với 16 người tham gia
INSERT INTO tournament_results (
  tournament_id,
  user_id,
  final_position,
  prize_money,
  elo_points_earned,
  spa_points_earned,
  matches_played,
  matches_won,
  matches_lost
) VALUES
-- Vị trí 1-3: Podium (E-rank SPA rewards)
('5386eecb-1970-4561-a412-3cb1da7af588', '3bd4ded0-2b7d-430c-b245-c10d079b333a', 1, 2000000, 100, 1500, 4, 4, 0), -- Anh Long Magic - Champion
('5386eecb-1970-4561-a412-3cb1da7af588', 'dc6705c7-6261-4caf-8f1b-2ec23ba87f05', 2, 1200000, 50, 1100, 4, 3, 1), -- Long SAng - Runner-up  
('5386eecb-1970-4561-a412-3cb1da7af588', 'e7fdac5e-f584-4bb5-b950-5b9c5ba234e3', 3, 800000, 25, 900, 3, 2, 1), -- Huỳnh Minh Hải - Third

-- Vị trí 4-8: Semi-finalists (E-rank SPA rewards, 0 VND prize money)
('5386eecb-1970-4561-a412-3cb1da7af588', 'd21aa2ab-4aa9-4263-81cf-5ec88b0ce22c', 4, 0, 15, 650, 3, 1, 2), -- Nguyễn Văn An
('5386eecb-1970-4561-a412-3cb1da7af588', '97205bb3-5faa-404c-87e7-ce5ffddd5dab', 5, 0, 15, 320, 2, 1, 1), -- Lê Hoàng Cường
('5386eecb-1970-4561-a412-3cb1da7af588', 'b7c1372f-10b8-484a-895b-4ae2a93d75c0', 6, 0, 10, 320, 2, 1, 1), -- Hoàng Văn Em
('5386eecb-1970-4561-a412-3cb1da7af588', '15779ca5-c658-4a8d-a1d6-2fb0ed9ccabf', 7, 0, 10, 320, 2, 1, 1), -- Ngô Văn Inh
('5386eecb-1970-4561-a412-3cb1da7af588', 'ccc9e099-34d4-427a-967e-89583eeb09d2', 8, 0, 10, 320, 2, 1, 1), -- Lý Thị Kỳ

-- Vị trí 9-16: Remaining participants (E-rank SPA rewards, 0 VND prize money) 
('5386eecb-1970-4561-a412-3cb1da7af588', 'c787c86d-d78e-4405-aa59-be7c696ca0fb', 9, 0, 5, 120, 1, 0, 1), -- Lại Văn Phú
('5386eecb-1970-4561-a412-3cb1da7af588', '5508669c-622f-4998-a039-635d315095e6', 10, 0, 5, 120, 1, 0, 1), -- Hồ Thị Quỳnh
('5386eecb-1970-4561-a412-3cb1da7af588', '4ae3af9d-a26d-46d1-890f-62e646128b37', 11, 0, 5, 120, 1, 0, 1), -- Phạm Minh Phong
('5386eecb-1970-4561-a412-3cb1da7af588', 'adc48e09-f9fe-4070-a72f-c0e0b452632a', 12, 0, 5, 120, 1, 0, 1), -- Lê Linh Bình
('5386eecb-1970-4561-a412-3cb1da7af588', 'e36df404-ae0c-4360-af90-ff1da5399a1f', 13, 0, 5, 120, 1, 0, 1), -- Lê Nam Khoa
('5386eecb-1970-4561-a412-3cb1da7af588', '27548e10-b91e-4f59-8c7d-215eac103573', 14, 0, 5, 120, 1, 0, 1), -- mamaa
('5386eecb-1970-4561-a412-3cb1da7af588', 'f478fb0b-560d-4f41-8786-9d0216130214', 15, 0, 5, 120, 1, 0, 1), -- Huỳnh Mai An
('5386eecb-1970-4561-a412-3cb1da7af588', '9d2f56a6-a133-43d2-955b-b5f8b03eb9be', 16, 0, 5, 120, 1, 0, 1); -- Huỳnh Văn Sơn