-- Fix Loser's Branch B Round 1/4 - chỉ giữ 2 trận thay vì 4 trận
-- Xóa 2 trận trùng lặp (match 2 và match 4)

DELETE FROM tournament_matches 
WHERE tournament_id = (SELECT id FROM tournaments WHERE name ILIKE '%new1%' LIMIT 1)
  AND bracket_type = 'losers'
  AND branch_type = 'branch_b'
  AND round_number = 1
  AND match_number IN (2, 4);

-- Cập nhật match_number cho các trận còn lại
UPDATE tournament_matches 
SET match_number = 2
WHERE tournament_id = (SELECT id FROM tournaments WHERE name ILIKE '%new1%' LIMIT 1)
  AND bracket_type = 'losers'
  AND branch_type = 'branch_b'
  AND round_number = 1
  AND match_number = 3;