-- Fix Round 2 Winner's Bracket matches to allow score input
-- Change status from 'ready' to 'in_progress' to enable score submission

UPDATE tournament_matches 
SET 
  status = 'in_progress',
  updated_at = NOW()
WHERE tournament_id = '62f5810b-8695-4ece-9daf-fa8c4bfbf4f7'
  AND round_number = 2 
  AND bracket_type = 'winners'
  AND player1_id IS NOT NULL 
  AND player2_id IS NOT NULL
  AND status = 'ready';

-- Also fix Loser's Branch A matches to allow score input
UPDATE tournament_matches 
SET 
  status = 'in_progress',
  updated_at = NOW()
WHERE tournament_id = '62f5810b-8695-4ece-9daf-fa8c4bfbf4f7'
  AND bracket_type = 'branch_a' 
  AND round_number = 101
  AND player1_id IS NOT NULL 
  AND player2_id IS NOT NULL
  AND status = 'ready';

-- Verify the changes
SELECT 
  tm.match_number,
  tm.round_number,
  tm.bracket_type,
  tm.status,
  p1.display_name as player1_name,
  p2.display_name as player2_name
FROM tournament_matches tm
LEFT JOIN profiles p1 ON tm.player1_id = p1.user_id
LEFT JOIN profiles p2 ON tm.player2_id = p2.user_id
WHERE tm.tournament_id = '62f5810b-8695-4ece-9daf-fa8c4bfbf4f7'
  AND (
    (tm.round_number = 2 AND tm.bracket_type = 'winners') OR
    (tm.round_number = 101 AND tm.bracket_type = 'branch_a')
  )
ORDER BY tm.bracket_type, tm.match_number;