-- Fix Round 103 to be empty until Round 102 is completed
UPDATE tournament_matches 
SET 
  player1_id = NULL,
  player2_id = NULL,
  status = 'pending',
  updated_at = NOW()
WHERE tournament_id = (
  SELECT id FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
  ORDER BY created_at DESC LIMIT 1
)
AND round_number = 103;