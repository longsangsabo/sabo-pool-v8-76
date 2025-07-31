-- Sửa lỗi bracket_type và branch_type cho double elimination
-- Giải đấu 16 người double elimination chuẩn:
-- Winner bracket: Rounds 1-3 (8 → 4 → 2)  
-- Loser bracket: Rounds 4-8 (losers drop down from winner bracket)

-- Cập nhật Winner Bracket (Rounds 1-3)
UPDATE tournament_matches 
SET bracket_type = 'winner', branch_type = null
WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
AND round_number BETWEEN 1 AND 3;

-- Cập nhật Loser Bracket (Rounds 4-8)
UPDATE tournament_matches 
SET bracket_type = 'loser', 
    branch_type = CASE 
      WHEN round_number IN (4,5,6) THEN 'branch_a'  -- LB rounds for early losers
      WHEN round_number IN (7,8) THEN 'branch_b'    -- LB rounds for later losers  
      ELSE null
    END
WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
AND round_number BETWEEN 4 AND 8;