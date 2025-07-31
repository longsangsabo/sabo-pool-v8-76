-- Clear và fix lại tournament double10
-- Step 1: Clear all advancement issues in Winners Round 2+
UPDATE tournament_matches 
SET player1_id = NULL, player2_id = NULL, updated_at = NOW()
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'winners'
  AND round_number >= 2;

-- Step 2: Clear all losers bracket assignments
UPDATE tournament_matches 
SET player1_id = NULL, player2_id = NULL, updated_at = NOW()
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type = 'losers';

-- Step 3: Clear semifinals and finals
UPDATE tournament_matches 
SET player1_id = NULL, player2_id = NULL, updated_at = NOW()
WHERE tournament_id = '80ac562c-0cc0-4384-842b-aa1a6badcc03'
  AND bracket_type IN ('semifinals', 'finals');