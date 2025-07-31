-- Xóa các trận đấu hiện tại của giải sabo1 để tạo lại sơ đồ single elimination
DELETE FROM tournament_matches WHERE tournament_id = '9b1d4071-755f-4604-a016-c1444bb36ac5';

-- Tạo sơ đồ Single Elimination cho 16 người chơi (4 vòng)
-- Round 1: 8 trận đấu (16 → 8)
INSERT INTO tournament_matches (
  tournament_id, round_number, match_number, bracket_type,
  player1_id, player2_id, status, created_at, updated_at
) VALUES
-- Round 1 (8 matches)
('9b1d4071-755f-4604-a016-c1444bb36ac5', 1, 1, 'single_elimination', 'f478fb0b-560d-4f41-8786-9d0216130214', '9d2f56a6-a133-43d2-955b-b5f8b03eb9be', 'scheduled', NOW(), NOW()),
('9b1d4071-755f-4604-a016-c1444bb36ac5', 1, 2, 'single_elimination', 'e7fdac5e-f584-4bb5-b950-5b9c5ba234e3', 'dc6705c7-6261-4caf-8f1b-2ec23ba87f05', 'scheduled', NOW(), NOW()),
('9b1d4071-755f-4604-a016-c1444bb36ac5', 1, 3, 'single_elimination', '570f94dd-91f1-4f43-9ad3-6f152db91f67', '5ad7e05f-56bd-4ea4-baa8-32286d4bfc4a', 'scheduled', NOW(), NOW()),
('9b1d4071-755f-4604-a016-c1444bb36ac5', 1, 4, 'single_elimination', 'adc48e09-f9fe-4070-a72f-c0e0b452632a', 'e36df404-ae0c-4360-af90-ff1da5399a1f', 'scheduled', NOW(), NOW()),
('9b1d4071-755f-4604-a016-c1444bb36ac5', 1, 5, 'single_elimination', 'b604f41b-e2e7-4453-9286-1bbde4cc96bc', 'da7b73f9-833b-4dd7-b887-c09e1cffca6f', 'scheduled', NOW(), NOW()),
('9b1d4071-755f-4604-a016-c1444bb36ac5', 1, 6, 'single_elimination', 'c1ee98ea-db15-4a29-9947-09cd5ad6a600', '64762c15-ecae-4634-bd99-058a0fd2bdb0', 'scheduled', NOW(), NOW()),
('9b1d4071-755f-4604-a016-c1444bb36ac5', 1, 7, 'single_elimination', 'c3a3216d-1963-40c9-95fb-0231e166bd06', '7551b33a-8163-4f0e-9785-046c530877fa', 'scheduled', NOW(), NOW()),
('9b1d4071-755f-4604-a016-c1444bb36ac5', 1, 8, 'single_elimination', '91932bd8-0f2f-492b-bc52-946d83aece06', '8312d755-d88c-4bfe-ada5-79093236aac9', 'scheduled', NOW(), NOW()),

-- Round 2: 4 trận đấu (8 → 4) - Quarterfinals
('9b1d4071-755f-4604-a016-c1444bb36ac5', 2, 1, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),
('9b1d4071-755f-4604-a016-c1444bb36ac5', 2, 2, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),
('9b1d4071-755f-4604-a016-c1444bb36ac5', 2, 3, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),
('9b1d4071-755f-4604-a016-c1444bb36ac5', 2, 4, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),

-- Round 3: 2 trận đấu (4 → 2) - Semifinals
('9b1d4071-755f-4604-a016-c1444bb36ac5', 3, 1, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),
('9b1d4071-755f-4604-a016-c1444bb36ac5', 3, 2, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),

-- Round 4: 1 trận đấu (2 → 1) - Final
('9b1d4071-755f-4604-a016-c1444bb36ac5', 4, 1, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW());