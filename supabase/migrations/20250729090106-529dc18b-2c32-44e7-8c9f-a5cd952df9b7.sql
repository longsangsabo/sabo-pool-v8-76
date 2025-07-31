-- Manual fix for double4 tournament - populate Branch B with correct players

-- 1. Place WB R2 losers (4 players) into Branch B R1 (2 matches)
-- WB R2 Match 1: winner 4bedc2fd-a85d-483d-80e5-c9541d6ecdc2, loser 9f5c350d-5ee2-4aa4-bd1e-e1ac2ed57e6a
-- WB R2 Match 2: winner ece1b398-9107-4ed6-ba30-6c3b7d725b0b, loser 1b20b730-51f7-4a58-9d14-ca168a51be99
-- WB R2 Match 3: winner d7d6ce12-490f-4fff-b913-80044de5e169, loser 2fbdd92e-1c53-4b9e-b156-f0d2621ed9df
-- WB R2 Match 4: winner 4aa58392-9e4d-42fc-a9ef-7b031c8279db, loser c00c6652-616f-4f4e-b764-8d8822d16f27

UPDATE tournament_matches 
SET player1_id = '9f5c350d-5ee2-4aa4-bd1e-e1ac2ed57e6a',
    player2_id = '1b20b730-51f7-4a58-9d14-ca168a51be99',
    status = 'scheduled'
WHERE tournament_id = '16cc9b3e-6c4d-4ec3-b721-668a42f8497d'
  AND match_stage = 'losers_branch_b'
  AND round_number = 201
  AND match_number = 1;

UPDATE tournament_matches 
SET player1_id = '2fbdd92e-1c53-4b9e-b156-f0d2621ed9df',
    player2_id = 'c00c6652-616f-4f4e-b764-8d8822d16f27',
    status = 'scheduled'
WHERE tournament_id = '16cc9b3e-6c4d-4ec3-b721-668a42f8497d'
  AND match_stage = 'losers_branch_b'
  AND round_number = 201
  AND match_number = 2;

-- 2. Place WB R3 losers (2 players) + Branch A R3 winner (1 player) into Branch B R2 (1 match)
-- WB R3 Match 1: winner d7d6ce12-490f-4fff-b913-80044de5e169, loser ece1b398-9107-4ed6-ba30-6c3b7d725b0b
-- WB R3 Match 2: winner 4bedc2fd-a85d-483d-80e5-c9541d6ecdc2, loser 4aa58392-9e4d-42fc-a9ef-7b031c8279db
-- Branch A R3: winner 3b4b5cf4-ce15-4036-9308-b21b076525b7

-- Branch B R2 will have: Branch A winner vs winners from Branch B R1 (when those complete)
-- For now, place the Branch A winner and one WB R3 loser
UPDATE tournament_matches 
SET player1_id = '3b4b5cf4-ce15-4036-9308-b21b076525b7',  -- Branch A R3 winner
    player2_id = 'ece1b398-9107-4ed6-ba30-6c3b7d725b0b',   -- WB R3 loser  
    status = 'scheduled'
WHERE tournament_id = '16cc9b3e-6c4d-4ec3-b721-668a42f8497d'
  AND match_stage = 'losers_branch_b'
  AND round_number = 202
  AND match_number = 1;