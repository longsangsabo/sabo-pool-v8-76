-- Fix Winners Round 3 and populate Losers Bracket for double10 tournament
-- Tournament ID: 80ac562c-0cc0-4384-842b-aa1a6badcc03

-- First, fix Winners Round 3 - correct player assignments
UPDATE tournament_matches 
SET player1_id = '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2',
    player2_id = '1b20b730-51f7-4a58-9d14-ca168a51be99'
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'winners'
  AND round_number = 3
  AND match_number = 1;

UPDATE tournament_matches 
SET player1_id = 'd7d6ce12-490f-4fff-b913-80044de5e169',
    player2_id = '4aa58392-9e4d-42fc-a9ef-7b031c8279db'
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'winners'
  AND round_number = 3
  AND match_number = 2;

-- Now populate Losers Bracket Round 11 (Branch A) with Round 1 losers
-- Round 1 losers: Match 1,2 -> Match 1; Match 3,4 -> Match 2; Match 5,6 -> Match 3; Match 7,8 -> Match 4

-- Losers R11 M1: Round 1 Match 1 & 2 losers
UPDATE tournament_matches 
SET player1_id = '519cf7c9-e112-40b2-9e4d-0cd44783ec9e', -- loser from R1M1
    player2_id = '0e541971-640e-4a5e-881b-b7f98a2904f7'  -- loser from R1M2
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'losers'
  AND round_number = 11
  AND match_number = 1;

-- Losers R11 M2: Round 1 Match 3 & 4 losers
UPDATE tournament_matches 
SET player1_id = '46bfe678-66cf-48a9-8bc8-d2eee8274ac3', -- loser from R1M3
    player2_id = '630730f6-6a4c-4e91-aab3-ce9bdc92057b'  -- loser from R1M4
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'losers'
  AND round_number = 11
  AND match_number = 2;

-- Losers R11 M3: Round 1 Match 5 & 6 losers
UPDATE tournament_matches 
SET player1_id = 'f271ced4-12e2-4643-8123-1a65df65acf8', -- loser from R1M5
    player2_id = 'c227cca4-9687-4964-8d4a-051198545b29'  -- loser from R1M6
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'losers'
  AND round_number = 11
  AND match_number = 3;

-- Losers R11 M4: Round 1 Match 7 & 8 losers
UPDATE tournament_matches 
SET player1_id = 'aa25684c-90e5-4c5c-aa23-83b65d398b62', -- loser from R1M7
    player2_id = 'c00c6652-616f-4f4e-b764-8d8822d16f27'  -- loser from R1M8
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'losers'
  AND round_number = 11
  AND match_number = 4;

-- Populate Losers Bracket Round 21 (Branch B) with Round 2 losers
-- R2M1 loser vs R2M2 loser -> R21M1
-- R2M3 loser vs R2M4 loser -> R21M2

UPDATE tournament_matches 
SET player1_id = '9f5c350d-5ee2-4aa4-bd1e-e1ac2ed57e6a', -- loser from R2M1
    player2_id = 'ece1b398-9107-4ed6-ba30-6c3b7d725b0b'  -- loser from R2M2
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'losers'
  AND round_number = 21
  AND match_number = 1;

UPDATE tournament_matches 
SET player1_id = '2fbdd92e-1c53-4b9e-b156-f0d2621ed9df', -- loser from R2M3
    player2_id = '3b4b5cf4-ce15-4036-9308-b21b076525b7'  -- loser from R2M4
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'losers'
  AND round_number = 21
  AND match_number = 2;