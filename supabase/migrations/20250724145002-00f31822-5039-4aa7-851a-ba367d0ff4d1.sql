-- Fix Loser's Branch A structure for new1 tournament
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

-- Step 4: Ensure proper match numbering in losers bracket
UPDATE tournament_matches 
SET match_number = ROW_NUMBER() OVER (
  PARTITION BY tournament_id, bracket_type, round_number 
  ORDER BY created_at
),
updated_at = NOW()
WHERE tournament_id IN (
  SELECT id FROM tournaments WHERE name ILIKE '%new1%'
)
AND bracket_type = 'losers';

-- Step 5: Create missing Round 3 match in Loser's Branch A if needed
-- This will create the final match for Branch A using winners from Round 2
INSERT INTO tournament_matches (
  tournament_id,
  round_number,
  match_number,
  bracket_type,
  branch_type,
  status,
  created_at,
  updated_at
)
SELECT DISTINCT
  tm.tournament_id,
  3 as round_number,
  1 as match_number,
  'losers' as bracket_type,
  'branch_a' as branch_type,
  'pending' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM tournament_matches tm
JOIN tournaments t ON tm.tournament_id = t.id
WHERE t.name ILIKE '%new1%'
AND tm.bracket_type = 'losers'
AND tm.round_number = 2
AND tm.branch_type = 'branch_a'
AND NOT EXISTS (
  SELECT 1 FROM tournament_matches tm2
  WHERE tm2.tournament_id = tm.tournament_id
  AND tm2.bracket_type = 'losers'
  AND tm2.round_number = 3
  AND tm2.branch_type = 'branch_a'
);