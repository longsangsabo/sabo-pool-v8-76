-- Fix Loser's Branch A structure for new1 tournament (corrected version)
-- Step 1: Delete invalid matches where player fights themselves
DELETE FROM tournament_matches 
WHERE id IN (
  SELECT tm.id 
  FROM tournament_matches tm
  JOIN tournaments t ON tm.tournament_id = t.id
  WHERE t.name ILIKE '%new1%'
  AND tm.player1_id = tm.player2_id
  AND tm.bracket_type IN ('loser', 'losers')
);

-- Step 2: Standardize bracket_type from 'loser' to 'losers'
UPDATE tournament_matches 
SET bracket_type = 'losers',
    updated_at = NOW()
WHERE tournament_id IN (
  SELECT id FROM tournaments WHERE name ILIKE '%new1%'
)
AND bracket_type = 'loser';

-- Step 3: Update branch_type for proper classification in losers bracket
UPDATE tournament_matches 
SET branch_type = CASE 
  WHEN bracket_type = 'losers' AND round_number <= 3 THEN 'branch_a'
  WHEN bracket_type = 'losers' AND round_number > 3 THEN 'branch_b'
  ELSE branch_type
END,
updated_at = NOW()
WHERE tournament_id IN (
  SELECT id FROM tournaments WHERE name ILIKE '%new1%'
)
AND bracket_type = 'losers';

-- Step 4: Fix match numbering using a CTE approach
WITH match_numbering AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tournament_id, bracket_type, round_number 
      ORDER BY created_at
    ) as new_match_number
  FROM tournament_matches 
  WHERE tournament_id IN (
    SELECT id FROM tournaments WHERE name ILIKE '%new1%'
  )
  AND bracket_type = 'losers'
)
UPDATE tournament_matches 
SET match_number = mn.new_match_number,
    updated_at = NOW()
FROM match_numbering mn
WHERE tournament_matches.id = mn.id;