-- Fix Loser's Branch A in double4 tournament - clear incorrectly placed players
-- Only keep losers from Winner's Bracket Round 1 in appropriate positions

-- Clear all players from Loser's Branch A matches first
UPDATE tournament_matches 
SET player1_id = NULL, player2_id = NULL, winner_id = NULL, status = 'scheduled'
WHERE tournament_id = '16cc9b3e-6c4d-4ec3-b721-668a42f8497d' 
  AND match_stage = 'losers_branch_a';

-- Now place ONLY the 8 losers from Winner's Bracket Round 1 into Branch A Round 1
-- WB R1 Match 1: winner 4bedc2fd-a85d-483d-80e5-c9541d6ecdc2, loser 519cf7c9-e112-40b2-9e4d-0cd44783ec9e
-- WB R1 Match 2: winner 9f5c350d-5ee2-4aa4-bd1e-e1ac2ed57e6a, loser 0e541971-640e-4a5e-881b-b7f98a2904f7
-- WB R1 Match 3: winner ece1b398-9107-4ed6-ba30-6c3b7d725b0b, loser 46bfe678-66cf-48a9-8bc8-d2eee8274ac3
-- WB R1 Match 4: winner 1b20b730-51f7-4a58-9d14-ca168a51be99, loser 630730f6-6a4c-4e91-aab3-ce9bdc92057b
-- WB R1 Match 5: winner d7d6ce12-490f-4fff-b913-80044de5e169, loser f271ced4-12e2-4643-8123-1a65df65acf8
-- WB R1 Match 6: winner 2fbdd92e-1c53-4b9e-b156-f0d2621ed9df, loser c227cca4-9687-4964-8d4a-051198545b29
-- WB R1 Match 7: winner 4aa58392-9e4d-42fc-a9ef-7b031c8279db, loser aa25684c-90e5-4c5c-aa23-83b65d398b62
-- WB R1 Match 8: winner c00c6652-616f-4f4e-b764-8d8822d16f27, loser 3b4b5cf4-ce15-4036-9308-b21b076525b7

-- Place the 8 losers into Branch A Round 1 matches
UPDATE tournament_matches 
SET player1_id = '519cf7c9-e112-40b2-9e4d-0cd44783ec9e', 
    player2_id = '0e541971-640e-4a5e-881b-b7f98a2904f7'
WHERE tournament_id = '16cc9b3e-6c4d-4ec3-b721-668a42f8497d' 
  AND match_stage = 'losers_branch_a' 
  AND round_number = 101 
  AND match_number = 1;

UPDATE tournament_matches 
SET player1_id = '46bfe678-66cf-48a9-8bc8-d2eee8274ac3', 
    player2_id = '630730f6-6a4c-4e91-aab3-ce9bdc92057b'
WHERE tournament_id = '16cc9b3e-6c4d-4ec3-b721-668a42f8497d' 
  AND match_stage = 'losers_branch_a' 
  AND round_number = 101 
  AND match_number = 2;

UPDATE tournament_matches 
SET player1_id = 'f271ced4-12e2-4643-8123-1a65df65acf8', 
    player2_id = 'c227cca4-9687-4964-8d4a-051198545b29'
WHERE tournament_id = '16cc9b3e-6c4d-4ec3-b721-668a42f8497d' 
  AND match_stage = 'losers_branch_a' 
  AND round_number = 101 
  AND match_number = 3;

UPDATE tournament_matches 
SET player1_id = 'aa25684c-90e5-4c5c-aa23-83b65d398b62', 
    player2_id = '3b4b5cf4-ce15-4036-9308-b21b076525b7'
WHERE tournament_id = '16cc9b3e-6c4d-4ec3-b721-668a42f8497d' 
  AND match_stage = 'losers_branch_a' 
  AND round_number = 101 
  AND match_number = 4;