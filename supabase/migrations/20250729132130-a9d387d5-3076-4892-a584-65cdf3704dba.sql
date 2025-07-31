-- Temporarily disable the auto-advance trigger to prevent further corruption
DROP TRIGGER IF EXISTS trigger_auto_advance_double_elimination_fixed ON tournament_matches;

-- Fix the corrupted bracket for double10 tournament
-- Clear all duplicate assignments in Winners Round 3
UPDATE tournament_matches 
SET player1_id = '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2',
    player2_id = '1b20b730-51f7-4a58-9d14-ca168a51be99',
    updated_at = NOW()
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'winners'
  AND round_number = 3
  AND match_number = 1;

UPDATE tournament_matches 
SET player1_id = 'd7d6ce12-490f-4fff-b913-80044de5e169',
    player2_id = '4aa58392-9e4d-42fc-a9ef-7b031c8279db',
    updated_at = NOW()
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'winners'
  AND round_number = 3
  AND match_number = 2;

-- Fix Losers Round 12 duplicates
UPDATE tournament_matches 
SET player1_id = '519cf7c9-e112-40b2-9e4d-0cd44783ec9e',
    player2_id = '46bfe678-66cf-48a9-8bc8-d2eee8274ac3',
    updated_at = NOW()
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'losers'
  AND round_number = 12
  AND match_number = 1;

UPDATE tournament_matches 
SET player1_id = 'f271ced4-12e2-4643-8123-1a65df65acf8',
    player2_id = 'aa25684c-90e5-4c5c-aa23-83b65d398b62',
    updated_at = NOW()
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'losers'
  AND round_number = 12
  AND match_number = 2;

-- Fix Losers Round 13 duplicate
UPDATE tournament_matches 
SET player1_id = NULL,
    player2_id = NULL,
    updated_at = NOW()
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'losers'
  AND round_number = 13
  AND match_number = 1;

-- Fix Losers Round 22 duplicate 
UPDATE tournament_matches 
SET player1_id = '9f5c350d-5ee2-4aa4-bd1e-e1ac2ed57e6a',
    player2_id = '2fbdd92e-1c53-4b9e-b156-f0d2621ed9df',
    updated_at = NOW()
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'losers'
  AND round_number = 22
  AND match_number = 1;

-- Fix Semifinals duplicate
UPDATE tournament_matches 
SET player1_id = NULL,
    player2_id = NULL,
    updated_at = NOW()
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'semifinals'
  AND round_number = 31
  AND match_number = 1;