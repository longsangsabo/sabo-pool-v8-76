-- Xóa các trận đấu hiện tại của giải double-1 để tạo lại sơ đồ double elimination
DELETE FROM tournament_matches WHERE tournament_id = 'baaadc65-8a64-4d82-aa95-5a8db8662daa';

-- Tạo sơ đồ double elimination cho 16 người chơi
-- Winner's Bracket Round 1 (8 matches)
INSERT INTO tournament_matches (
  tournament_id, round_number, match_number, bracket_type,
  player1_id, player2_id, status, created_at, updated_at
) VALUES
-- WB Round 1
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 1, 1, 'winner', '91932bd8-0f2f-492b-bc52-946d83aece06', 'da7b73f9-833b-4dd7-b887-c09e1cffca6f', 'scheduled', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 1, 2, 'winner', '64762c15-ecae-4634-bd99-058a0fd2bdb0', 'dc6705c7-6261-4caf-8f1b-2ec23ba87f05', 'scheduled', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 1, 3, 'winner', '7551b33a-8163-4f0e-9785-046c530877fa', 'b604f41b-e2e7-4453-9286-1bbde4cc96bc', 'scheduled', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 1, 4, 'winner', 'adc48e09-f9fe-4070-a72f-c0e0b452632a', 'f478fb0b-560d-4f41-8786-9d0216130214', 'scheduled', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 1, 5, 'winner', '570f94dd-91f1-4f43-9ad3-6f152db91f67', 'c3a3216d-1963-40c9-95fb-0231e166bd06', 'scheduled', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 1, 6, 'winner', 'c1ee98ea-db15-4a29-9947-09cd5ad6a600', 'e7fdac5e-f584-4bb5-b950-5b9c5ba234e3', 'scheduled', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 1, 7, 'winner', 'e36df404-ae0c-4360-af90-ff1da5399a1f', '3bd4ded0-2b7d-430c-b245-c10d079b333a', 'scheduled', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 1, 8, 'winner', '9d2f56a6-a133-43d2-955b-b5f8b03eb9be', '5ad7e05f-56bd-4ea4-baa8-32286d4bfc4a', 'scheduled', NOW(), NOW()),

-- WB Round 2 (4 matches)
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 2, 1, 'winner', NULL, NULL, 'pending', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 2, 2, 'winner', NULL, NULL, 'pending', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 2, 3, 'winner', NULL, NULL, 'pending', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 2, 4, 'winner', NULL, NULL, 'pending', NOW(), NOW()),

-- WB Round 3 (2 matches - WB Semifinals)
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 3, 1, 'winner', NULL, NULL, 'pending', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 3, 2, 'winner', NULL, NULL, 'pending', NOW(), NOW()),

-- WB Round 4 (1 match - WB Final)
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 4, 1, 'winner', NULL, NULL, 'pending', NOW(), NOW()),

-- Loser's Bracket Round 1 (4 matches)
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 1, 1, 'loser', NULL, NULL, 'pending', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 1, 2, 'loser', NULL, NULL, 'pending', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 1, 3, 'loser', NULL, NULL, 'pending', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 1, 4, 'loser', NULL, NULL, 'pending', NOW(), NOW()),

-- Loser's Bracket Round 2 (2 matches)
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 2, 1, 'loser', NULL, NULL, 'pending', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 2, 2, 'loser', NULL, NULL, 'pending', NOW(), NOW()),

-- Loser's Bracket Round 3 (2 matches)
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 3, 1, 'loser', NULL, NULL, 'pending', NOW(), NOW()),
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 3, 2, 'loser', NULL, NULL, 'pending', NOW(), NOW()),

-- Loser's Bracket Round 4 (1 match)
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 4, 1, 'loser', NULL, NULL, 'pending', NOW(), NOW()),

-- Loser's Bracket Round 5 (1 match)
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 5, 1, 'loser', NULL, NULL, 'pending', NOW(), NOW()),

-- Loser's Bracket Round 6 (1 match - LB Final)
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 6, 1, 'loser', NULL, NULL, 'pending', NOW(), NOW()),

-- Grand Final (1 match)
('baaadc65-8a64-4d82-aa95-5a8db8662daa', 1, 1, 'final', NULL, NULL, 'pending', NOW(), NOW());