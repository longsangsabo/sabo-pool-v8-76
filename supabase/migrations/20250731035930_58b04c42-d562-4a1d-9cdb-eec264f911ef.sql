-- Cập nhật tournament results theo data trong hình
-- Fix vị trí: 1, 2, 3, 3, 5, 6->16

-- Cập nhật vị trí và phần thưởng theo hình
UPDATE tournament_results 
SET 
  final_position = 1,
  spa_points_earned = 1500,
  elo_points_earned = 100,
  prize_amount = 5000000,
  placement_type = 'champion'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = '46bfe678-66cf-48a9-8bc8-d2eee8274ac3'; -- Đặng Linh Khoa

UPDATE tournament_results 
SET 
  final_position = 2,
  spa_points_earned = 1000,
  elo_points_earned = 50,
  prize_amount = 3000000,
  placement_type = 'runner_up'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = 'ece1b398-9107-4ed6-ba30-6c3b7d725b0b'; -- Đặng Hùng Quân

-- Tạo 2 vị trí hạng 3 (tie for 3rd place)
UPDATE tournament_results 
SET 
  final_position = 3,
  spa_points_earned = 500,
  elo_points_earned = 25,
  prize_amount = 1500000,
  placement_type = 'third_place'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = '630730f6-6a4c-4e91-aab3-ce9bdc92057b'; -- Võ Lan Khoa

-- Thêm người thứ 2 cho hạng 3 (giả sử là Anh Long)
UPDATE tournament_results 
SET 
  final_position = 3,
  spa_points_earned = 500,
  elo_points_earned = 25,
  prize_amount = 1500000,
  placement_type = 'third_place'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = 'd7d6ce12-490f-4fff-b913-80044de5e169'; -- Anh Long

-- Cập nhật vị trí 5 (Đặng Linh Hải)
UPDATE tournament_results 
SET 
  final_position = 5,
  spa_points_earned = 200,
  elo_points_earned = 15,
  prize_amount = 500000,
  placement_type = 'top_8'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = '0e541971-640e-4a5e-881b-b7f98a2904f7'; -- Đặng Linh Hải

-- Cập nhật vị trí 6 (Vũ Văn Cường)
UPDATE tournament_results 
SET 
  final_position = 6,
  spa_points_earned = 150,
  elo_points_earned = 12,
  prize_amount = 300000,
  placement_type = 'top_8'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = 'c00c6652-616f-4f4e-b764-8d8822d16f27'; -- Vũ Văn Cường

-- Cập nhật vị trí 7 (Võ Hương Cường)
UPDATE tournament_results 
SET 
  final_position = 7,
  spa_points_earned = 120,
  elo_points_earned = 10,
  prize_amount = 200000,
  placement_type = 'top_8'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = '1b20b730-51f7-4a58-9d14-ca168a51be99'; -- Võ Hương Cường

-- Cập nhật vị trí 8 (Phạm Minh Long)
UPDATE tournament_results 
SET 
  final_position = 8,
  spa_points_earned = 100,
  elo_points_earned = 8,
  prize_amount = 100000,
  placement_type = 'top_8'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = 'c227cca4-9687-4964-8d4a-051198545b29'; -- Phạm Minh Long

-- Cập nhật các vị trí 9-16 với phần thưởng participation
UPDATE tournament_results 
SET 
  final_position = 9,
  spa_points_earned = 80,
  elo_points_earned = 5,
  prize_amount = 50000,
  placement_type = 'participant'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = '2fbdd92e-1c53-4b9e-b156-f0d2621ed9df'; -- Nguyễn Thị Phong

UPDATE tournament_results 
SET 
  final_position = 10,
  spa_points_earned = 70,
  elo_points_earned = 5,
  prize_amount = 50000,
  placement_type = 'participant'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = '3b4b5cf4-ce15-4036-9308-b21b076525b7'; -- Đặng Hùng Hải

UPDATE tournament_results 
SET 
  final_position = 11,
  spa_points_earned = 60,
  elo_points_earned = 4,
  prize_amount = 0,
  placement_type = 'participant'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = 'f271ced4-12e2-4643-8123-1a65df65acf8'; -- Vũ Nam Khoa

UPDATE tournament_results 
SET 
  final_position = 12,
  spa_points_earned = 50,
  elo_points_earned = 4,
  prize_amount = 0,
  placement_type = 'participant'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = '4aa58392-9e4d-42fc-a9ef-7b031c8279db'; -- Phan Lan Cường

UPDATE tournament_results 
SET 
  final_position = 13,
  spa_points_earned = 40,
  elo_points_earned = 3,
  prize_amount = 0,
  placement_type = 'participant'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2'; -- Phan Thị Bình

UPDATE tournament_results 
SET 
  final_position = 14,
  spa_points_earned = 30,
  elo_points_earned = 2,
  prize_amount = 0,
  placement_type = 'participant'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = 'aa25684c-90e5-4c5c-aa23-83b65d398b62'; -- Trần Nam Phong

UPDATE tournament_results 
SET 
  final_position = 15,
  spa_points_earned = 20,
  elo_points_earned = 1,
  prize_amount = 0,
  placement_type = 'participant'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = '9f5c350d-5ee2-4aa4-bd1e-e1ac2ed57e6a'; -- Phan Hùng Phong

UPDATE tournament_results 
SET 
  final_position = 16,
  spa_points_earned = 10,
  elo_points_earned = 1,
  prize_amount = 0,
  placement_type = 'participant'
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2' 
  AND user_id = '519cf7c9-e112-40b2-9e4d-0cd44783ec9e'; -- Phan Nam Long

-- Cập nhật timestamps
UPDATE tournament_results 
SET updated_at = NOW()
WHERE tournament_id = 'd0af367a-18d7-41b9-a5b6-aaf3de5d1bb2';