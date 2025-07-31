-- Fix LBA logic: Clear invalid players from R102 and R103
-- Only R101 should have players initially

-- Clear players from LBA R102 and R103 since R101 hasn't completed yet
UPDATE tournament_matches 
SET player1_id = NULL, player2_id = NULL, winner_id = NULL, status = 'pending'
WHERE bracket_type = 'losers' 
  AND match_stage = 'losers_branch_a'
  AND round_number IN (102, 103);

-- Ensure R101 matches are properly set up (should already be correct)
UPDATE tournament_matches 
SET status = 'scheduled'
WHERE bracket_type = 'losers' 
  AND match_stage = 'losers_branch_a'
  AND round_number = 101
  AND player1_id IS NOT NULL 
  AND player2_id IS NOT NULL;