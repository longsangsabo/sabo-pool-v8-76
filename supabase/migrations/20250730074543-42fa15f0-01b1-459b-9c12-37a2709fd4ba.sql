-- PHASE 1: Fix duplicate players in double6 tournament
-- Based on analysis of double6 tournament data where duplicates were found

-- Fix Round 102 Match 2: Set player2 to winner of R101 M3 (0e541971-88cc-4ce2-a4bc-a830c72e1e8a)
UPDATE tournament_matches 
SET player2_id = '0e541971-88cc-4ce2-a4bc-a830c72e1e8a',
    updated_at = NOW()
WHERE tournament_id = (
  SELECT id FROM tournaments WHERE name ILIKE '%double6%' ORDER BY created_at DESC LIMIT 1
)
AND round_number = 102 
AND match_number = 2;

-- Fix Round 103 Match 1: Reset both players to NULL so advancement function can reassign correctly
UPDATE tournament_matches 
SET player1_id = NULL,
    player2_id = NULL,
    updated_at = NOW()
WHERE tournament_id = (
  SELECT id FROM tournaments WHERE name ILIKE '%double6%' ORDER BY created_at DESC LIMIT 1
)
AND round_number = 103 
AND match_number = 1;

-- Fix Round 202 Match 1: Set player2 to winner of R201 M2 (519cf7c9-6b6f-403d-9abe-6b62f8e9d52f)
UPDATE tournament_matches 
SET player2_id = '519cf7c9-6b6f-403d-9abe-6b62f8e9d52f',
    updated_at = NOW()
WHERE tournament_id = (
  SELECT id FROM tournaments WHERE name ILIKE '%double6%' ORDER BY created_at DESC LIMIT 1
)
AND round_number = 202 
AND match_number = 1;