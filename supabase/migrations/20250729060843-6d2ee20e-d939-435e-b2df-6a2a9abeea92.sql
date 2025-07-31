-- Fix LBB: Auto advance losers from WB R2 to LBB R201
-- Manual fix first, then enhance trigger

-- WB R2 Match 1 loser -> LBB R201 Match 1 Player 1
UPDATE tournament_matches 
SET player1_id = '9f5c350d-5ee2-4aa4-bd1e-e1ac2ed57e6a', -- Phan Hùng Phong (loser WB R2 M1)
    status = 'pending'
WHERE tournament_id = '42a94292-c20e-4c58-b923-7748f138c49f'
  AND round_number = 201 
  AND match_number = 1
  AND bracket_type = 'losers';

-- WB R2 Match 2 loser -> LBB R201 Match 1 Player 2  
UPDATE tournament_matches 
SET player2_id = '1b20b730-51f7-4a58-9d14-ca168a51be99', -- Võ Hương Cường (loser WB R2 M2)
    status = 'scheduled'
WHERE tournament_id = '42a94292-c20e-4c58-b923-7748f138c49f'
  AND round_number = 201 
  AND match_number = 1
  AND bracket_type = 'losers';

-- WB R2 Match 3 loser -> LBB R201 Match 2 Player 1
UPDATE tournament_matches 
SET player1_id = 'c227cca4-9687-4964-8d4a-051198545b29', -- Phạm Minh Long (loser WB R2 M3)
    status = 'pending'
WHERE tournament_id = '42a94292-c20e-4c58-b923-7748f138c49f'
  AND round_number = 201 
  AND match_number = 2
  AND bracket_type = 'losers';

-- WB R2 Match 4 loser -> LBB R201 Match 2 Player 2
UPDATE tournament_matches 
SET player2_id = 'c00c6652-616f-4f4e-b764-8d8822d16f27', -- Vũ Văn Cường (loser WB R2 M4)
    status = 'scheduled'
WHERE tournament_id = '42a94292-c20e-4c58-b923-7748f138c49f'
  AND round_number = 201 
  AND match_number = 2
  AND bracket_type = 'losers';