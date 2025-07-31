-- Manual fix for double4 Championship Final advancement
-- Current situation:
-- 1. Round 250 completed: 2 winners available 
-- 2. Round 4 NOT completed: still scheduled
-- But according to double elimination logic, if Round 250 (Loser's Semifinal) has 2 completed matches,
-- that means Round 250 should consolidate into 1 final loser's bracket winner

-- Check current Round 250 matches
SELECT 
  id, round_number, match_number, player1_id, player2_id, winner_id, status,
  match_stage, bracket_type
FROM tournament_matches 
WHERE tournament_id = '16cc9b3e-6c4d-4ec3-b721-668a42f8497d'
  AND round_number = 250
ORDER BY match_number;