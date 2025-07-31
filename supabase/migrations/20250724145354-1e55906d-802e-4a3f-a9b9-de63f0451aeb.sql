-- Fix Loser's Branch A structure for new1 tournament - correct Round 2 and advance winners

-- Step 1: Delete unnecessary matches in Round 2 (match 3 and 4)
DELETE FROM tournament_matches 
WHERE tournament_id IN (
  SELECT id FROM tournaments WHERE name ILIKE '%new1%'
)
AND bracket_type = 'losers' 
AND branch_type = 'branch_a'
AND round_number = 2
AND match_number IN (3, 4)
AND player1_id IS NULL 
AND player2_id IS NULL;

-- Step 2: Get the two winners from Round 2 and advance them to Round 3
UPDATE tournament_matches
SET player1_id = (
  SELECT winner_id 
  FROM tournament_matches tm2
  WHERE tm2.tournament_id = tournament_matches.tournament_id
  AND tm2.bracket_type = 'losers'
  AND tm2.branch_type = 'branch_a' 
  AND tm2.round_number = 2
  AND tm2.match_number = 1
  AND tm2.winner_id IS NOT NULL
),
player2_id = (
  SELECT winner_id 
  FROM tournament_matches tm2
  WHERE tm2.tournament_id = tournament_matches.tournament_id
  AND tm2.bracket_type = 'losers'
  AND tm2.branch_type = 'branch_a'
  AND tm2.round_number = 2
  AND tm2.match_number = 2
  AND tm2.winner_id IS NOT NULL
),
status = 'pending',
updated_at = NOW()
WHERE tournament_id IN (
  SELECT id FROM tournaments WHERE name ILIKE '%new1%'
)
AND bracket_type = 'losers'
AND branch_type = 'branch_a'
AND round_number = 3
AND match_number = 1;