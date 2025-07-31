-- Sửa lại winner_id cho trận bán kết trận 1 - Long SAng thắng 1-0
UPDATE tournament_matches 
SET winner_id = 'dc6705c7-6261-4caf-8f1b-2ec23ba87f05' -- Long SAng
WHERE id = 'd69a0f15-69ac-4766-855b-3d1715b861b9';

-- Sửa lại chung kết - phải là Long SAng vs Demo User 1 (đúng với người thắng bán kết)
UPDATE tournament_matches 
SET 
  player1_id = 'dc6705c7-6261-4caf-8f1b-2ec23ba87f05', -- Long SAng (thắng bán kết trận 1)
  player2_id = '89a58aeb-01ae-49a6-8791-44af493811bc'  -- Demo User 1 (thắng bán kết trận 2)
WHERE id = 'ec0c23e0-d19a-4e56-9a48-8dfa524d03c1';

-- Xóa trận tranh hạng 3 hiện tại và tạo lại với đúng logic
DELETE FROM tournament_matches 
WHERE tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa' 
AND is_third_place_match = true;

-- Tạo lại trận tranh hạng 3 với 2 người thua bán kết:
-- Club Owner 1752123983536 (thua Long SAng ở bán kết trận 1)
-- Club Owner 1752123983287 (thua Demo User 1 ở bán kết trận 2)
INSERT INTO tournament_matches (
  tournament_id,
  round_number,
  match_number,
  player1_id,
  player2_id,
  status,
  is_third_place_match,
  scheduled_time,
  created_at,
  updated_at
) VALUES (
  '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa',
  4, -- Same round as final
  2, -- Match number 2
  'c1ee98ea-db15-4a29-9947-09cd5ad6a600', -- Club Owner 1752123983536 (thua bán kết trận 1)
  'b604f41b-e2e7-4453-9286-1bbde4cc96bc', -- Club Owner 1752123983287 (thua bán kết trận 2)
  'scheduled',
  true,
  NOW(),
  NOW(),
  NOW()
);