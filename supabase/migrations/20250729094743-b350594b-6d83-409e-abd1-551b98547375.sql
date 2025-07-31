-- Fix double6 tournament duplicate player assignments
-- First, let's check the current state of double6
SELECT 
  id,
  name,
  status,
  tournament_type
FROM tournaments 
WHERE name = 'double6';

-- Check matches with duplicate players in double6
SELECT 
  tm.id,
  tm.tournament_id,
  tm.round_number,
  tm.match_number,
  tm.player1_id,
  tm.player2_id,
  tm.status,
  tm.bracket_type,
  tm.match_stage
FROM tournament_matches tm
JOIN tournaments t ON tm.tournament_id = t.id
WHERE t.name = 'double6'
  AND tm.player1_id = tm.player2_id
  AND tm.player1_id IS NOT NULL
ORDER BY tm.round_number, tm.match_number;

-- Reset duplicate player assignments in double6 to NULL
-- This will allow auto-advancement to populate them correctly
UPDATE tournament_matches 
SET 
  player1_id = NULL,
  player2_id = NULL,
  status = 'pending',
  updated_at = NOW()
WHERE tournament_id = (
  SELECT id FROM tournaments WHERE name = 'double6'
)
AND player1_id = player2_id 
AND player1_id IS NOT NULL;

-- Also reset any incomplete matches that shouldn't have players yet
UPDATE tournament_matches 
SET 
  player1_id = NULL,
  player2_id = NULL, 
  status = 'pending',
  updated_at = NOW()
WHERE tournament_id = (
  SELECT id FROM tournaments WHERE name = 'double6'
)
AND round_number > 1
AND (player1_id IS NULL OR player2_id IS NULL)
AND status != 'completed';

-- Now repair the bracket structure using the repair function
SELECT repair_double_elimination_bracket_v2(
  (SELECT id FROM tournaments WHERE name = 'double6')
) as repair_result;