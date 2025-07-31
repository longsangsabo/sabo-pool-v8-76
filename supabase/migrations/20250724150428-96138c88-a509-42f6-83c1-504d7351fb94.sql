-- Fix Loser's Branch B for tournament "new1" 
-- Move 4 losers from Winners Bracket Round 2 to Round 1/4 of Loser's Branch B

-- Get tournament ID for "new1"
WITH tournament_info AS (
  SELECT id as tournament_id 
  FROM tournaments 
  WHERE name ILIKE '%new1%' 
  LIMIT 1
),

-- Get the 4 losers from Winners Bracket Round 2
winners_round2_losers AS (
  SELECT 
    CASE WHEN player1_id = winner_id THEN player2_id ELSE player1_id END as loser_id,
    match_number,
    ROW_NUMBER() OVER (ORDER BY match_number) as rn
  FROM tournament_matches tm
  JOIN tournament_info ti ON tm.tournament_id = ti.tournament_id
  WHERE bracket_type = 'winners' 
    AND round_number = 2 
    AND status = 'completed'
    AND winner_id IS NOT NULL
),

-- Get Branch B Round 1/4 matches that need to be populated
branch_b_matches AS (
  SELECT id, match_number, 
    ROW_NUMBER() OVER (ORDER BY match_number) as rn
  FROM tournament_matches tm
  JOIN tournament_info ti ON tm.tournament_id = ti.tournament_id
  WHERE bracket_type = 'losers' 
    AND branch_type = 'branch_b' 
    AND round_number = 4  -- This should be Round 1/4 of Branch B
  ORDER BY match_number
  LIMIT 4
)

-- Update Branch B Round 1/4 matches with proper player assignments
UPDATE tournament_matches 
SET 
  player1_id = CASE 
    WHEN branch_b_matches.rn = 1 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 1)
    WHEN branch_b_matches.rn = 2 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 3)
    WHEN branch_b_matches.rn = 3 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 2)
    WHEN branch_b_matches.rn = 4 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 4)
  END,
  player2_id = CASE 
    WHEN branch_b_matches.rn = 1 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 2)
    WHEN branch_b_matches.rn = 2 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 4)
    WHEN branch_b_matches.rn = 3 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 1)
    WHEN branch_b_matches.rn = 4 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 3)
  END,
  status = 'scheduled',
  winner_id = NULL,
  score_player1 = NULL,
  score_player2 = NULL
FROM branch_b_matches
WHERE tournament_matches.id = branch_b_matches.id;

-- Fix round numbering for Branch B to match double elimination structure
-- Branch B Round 1/4 should be round 1, not round 4
UPDATE tournament_matches 
SET round_number = 1
FROM tournament_info ti
WHERE tournament_matches.tournament_id = ti.tournament_id
  AND bracket_type = 'losers' 
  AND branch_type = 'branch_b' 
  AND round_number = 4;

-- Fix round numbering for Branch B Round 1/2 (Final)
UPDATE tournament_matches 
SET round_number = 2
FROM tournament_info ti
WHERE tournament_matches.tournament_id = ti.tournament_id
  AND bracket_type = 'losers' 
  AND branch_type = 'branch_b' 
  AND round_number = 5;