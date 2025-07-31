-- Sửa lại Loser's Branch A - Update đúng bracket_type 'losers' 
-- Round 1/4: 4 winners từ Round 1/8 → 2 matches

-- Lấy 4 winners từ losers bracket round 1
WITH round1_winners AS (
  SELECT winner_id, match_number,
    ROW_NUMBER() OVER (ORDER BY match_number) as winner_order
  FROM tournament_matches
  WHERE tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'
    AND bracket_type = 'losers'
    AND round_number = 1
    AND status = 'completed'
    AND winner_id IS NOT NULL
)
-- Update Round 1/4 matches (losers bracket round 2)
UPDATE tournament_matches 
SET 
  player1_id = CASE 
    WHEN match_number = 20 THEN (SELECT winner_id FROM round1_winners WHERE winner_order = 1)
    WHEN match_number = 21 THEN (SELECT winner_id FROM round1_winners WHERE winner_order = 3)
    ELSE player1_id
  END,
  player2_id = CASE 
    WHEN match_number = 20 THEN (SELECT winner_id FROM round1_winners WHERE winner_order = 2)  
    WHEN match_number = 21 THEN (SELECT winner_id FROM round1_winners WHERE winner_order = 4)
    ELSE player2_id
  END,
  status = CASE 
    WHEN match_number IN (20, 21) THEN 'scheduled'
    ELSE status
  END
WHERE tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'
  AND bracket_type = 'losers'
  AND round_number = 2
  AND match_number IN (20, 21);