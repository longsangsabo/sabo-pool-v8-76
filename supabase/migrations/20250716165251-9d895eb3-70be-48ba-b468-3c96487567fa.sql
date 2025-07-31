-- Disable the auto_complete_tournament trigger temporarily
DROP TRIGGER IF EXISTS trigger_auto_complete_tournament ON tournaments;

-- Try direct insertion instead of function
DELETE FROM tournament_matches WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07';

-- Manual insertion for testing
WITH participants AS (
  SELECT user_id, ROW_NUMBER() OVER (ORDER BY created_at) as position
  FROM tournament_registrations 
  WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07' 
  AND registration_status = 'confirmed'
)
-- Insert Winner Bracket Round 1 matches  
INSERT INTO tournament_matches (
  tournament_id, round_number, match_number, 
  player1_id, player2_id, status, bracket_type, 
  created_at, updated_at
)
SELECT 
  'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'::uuid,
  1,
  ((p1.position + 1) / 2)::int,
  p1.user_id,
  p2.user_id,
  'scheduled',
  'winner',
  now(),
  now()
FROM participants p1
JOIN participants p2 ON p2.position = p1.position + 1
WHERE p1.position % 2 = 1 AND p1.position <= 16;