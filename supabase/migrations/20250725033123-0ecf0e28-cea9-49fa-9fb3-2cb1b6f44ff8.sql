-- Fix Loser's Branch B Round 1/2 (Final) - chỉ giữ 1 trận thay vì 3 trận
-- Xóa 2 trận thừa (match 2 và match 3)

DELETE FROM tournament_matches 
WHERE tournament_id = (SELECT id FROM tournaments WHERE name ILIKE '%new1%' LIMIT 1)
  AND bracket_type = 'losers'
  AND branch_type = 'branch_b'
  AND round_number = 2
  AND match_number IN (2, 3);