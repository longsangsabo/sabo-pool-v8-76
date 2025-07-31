-- Fix vòng 2 bị thiếu trận cho tournament Single Elimination
-- Tạo thêm 3 trận còn lại cho vòng 2 (match 2, 3, 4)

INSERT INTO tournament_matches (
  tournament_id,
  round_number,
  match_number,
  status,
  created_at,
  updated_at
) VALUES 
  ('675d9a5a-d3b1-452a-b019-91303ea4712b', 2, 2, 'pending', NOW(), NOW()),
  ('675d9a5a-d3b1-452a-b019-91303ea4712b', 2, 3, 'pending', NOW(), NOW()),
  ('675d9a5a-d3b1-452a-b019-91303ea4712b', 2, 4, 'pending', NOW(), NOW());

-- Bây giờ chạy repair function để advance winners vào đúng trận
SELECT repair_tournament_advancement('675d9a5a-d3b1-452a-b019-91303ea4712b');