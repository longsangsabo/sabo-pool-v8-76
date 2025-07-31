-- Manual place losers to test if structure works
-- Place WB Round 1 losers in Branch A Round 1 (Round 4)

-- Place Club Owner 1752123983287 in first available Branch A match
UPDATE tournament_matches 
SET player1_id = 'b604f41b-e2e7-4453-9286-1bbde4cc96bc',
    updated_at = now()
WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
AND bracket_type = 'loser' 
AND branch_type = 'branch_a'
AND round_number = 4
AND match_number = 1;

-- Place Lê Nam Khoa in next available Branch A match
UPDATE tournament_matches 
SET player1_id = 'e36df404-ae0c-4360-af90-ff1da5399a1f',
    updated_at = now()
WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
AND bracket_type = 'loser' 
AND branch_type = 'branch_a'
AND round_number = 4
AND match_number = 2;

-- Place Huỳnh Minh Hải in next available Branch A match
UPDATE tournament_matches 
SET player1_id = 'e7fdac5e-f584-4bb5-b950-5b9c5ba234e3',
    updated_at = now()
WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
AND bracket_type = 'loser' 
AND branch_type = 'branch_a'
AND round_number = 4
AND match_number = 3;