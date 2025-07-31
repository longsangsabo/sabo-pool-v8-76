-- Fix Loser's Branch B for tournament "new1" 
-- Move 4 losers from Winners Bracket Round 2 to Round 1/4 of Loser's Branch B

-- Step 1: Update Branch B Round 1/4 matches with the 4 losers from Winners Round 2
WITH tournament_info AS (
  SELECT id as tournament_id 
  FROM tournaments 
  WHERE name ILIKE '%new1%' 
  LIMIT 1
),
winners_round2_losers AS (
  SELECT 
    CASE WHEN player1_id = winner_id THEN player2_id ELSE player1_id END as loser_id,
    match_number,
    ROW_NUMBER() OVER (ORDER BY match_number) as rn
  FROM tournament_matches tm, tournament_info ti
  WHERE tm.tournament_id = ti.tournament_id
    AND bracket_type = 'winners' 
    AND round_number = 2 
    AND status = 'completed'
    AND winner_id IS NOT NULL
),
branch_b_matches AS (
  SELECT id, match_number, 
    ROW_NUMBER() OVER (ORDER BY match_number) as rn
  FROM tournament_matches tm, tournament_info ti
  WHERE tm.tournament_id = ti.tournament_id
    AND bracket_type = 'losers' 
    AND branch_type = 'branch_b' 
    AND round_number = 4
  ORDER BY match_number
  LIMIT 4
),
match_assignments AS (
  SELECT 
    bm.id,
    CASE 
      WHEN bm.rn = 1 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 1)
      WHEN bm.rn = 2 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 2)
      WHEN bm.rn = 3 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 3)
      WHEN bm.rn = 4 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 4)
    END as player1_id,
    CASE 
      WHEN bm.rn = 1 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 2)
      WHEN bm.rn = 2 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 1)
      WHEN bm.rn = 3 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 4)
      WHEN bm.rn = 4 THEN (SELECT loser_id FROM winners_round2_losers WHERE rn = 3)
    END as player2_id
  FROM branch_b_matches bm
)
UPDATE tournament_matches 
SET 
  player1_id = ma.player1_id,
  player2_id = ma.player2_id,
  status = 'scheduled',
  winner_id = NULL,
  score_player1 = NULL,
  score_player2 = NULL,
  round_number = 1  -- Fix round numbering
FROM match_assignments ma
WHERE tournament_matches.id = ma.id;

-- Step 2: Fix other Branch B round numbers
UPDATE tournament_matches 
SET round_number = 2
WHERE tournament_id = (SELECT id FROM tournaments WHERE name ILIKE '%new1%' LIMIT 1)
  AND bracket_type = 'losers' 
  AND branch_type = 'branch_b' 
  AND round_number = 5;