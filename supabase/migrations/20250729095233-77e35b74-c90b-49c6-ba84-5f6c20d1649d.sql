-- Fix proper Loser's Branch A logic và round numbers cho double6
-- Loser's Branch A chỉ nhận losers từ round 1 Winner's Bracket

-- First, let's see the correct structure from double1
SELECT 
  'double1' as tournament,
  tm.round_number,
  tm.match_number, 
  tm.bracket_type,
  tm.branch_type,
  tm.loser_branch,
  tm.match_stage
FROM tournament_matches tm
JOIN tournaments t ON tm.tournament_id = t.id
WHERE t.name = 'double1'
  AND tm.bracket_type = 'losers'
ORDER BY tm.round_number, tm.match_number;

-- Reset và fix double6 với đúng logic
-- Round 1 Losers = Branch A (nhận losers từ round 1 winners)
UPDATE tournament_matches 
SET 
  round_number = 1,
  branch_type = 'A',
  loser_branch = 'A',
  match_stage = 'losers_round_1_branch_a',
  updated_at = NOW()
WHERE tournament_id = (SELECT id FROM tournaments WHERE name = 'double6')
  AND bracket_type = 'losers'
  AND round_number = 101;  -- Old round numbering

-- Round 2 Losers = Branch B nhận round 1 winners losers + Branch A winners
UPDATE tournament_matches 
SET 
  round_number = 2,
  branch_type = 'B',
  loser_branch = 'B',
  match_stage = 'losers_round_2_branch_b',
  updated_at = NOW()
WHERE tournament_id = (SELECT id FROM tournaments WHERE name = 'double6')
  AND bracket_type = 'losers'
  AND round_number = 102;

-- Round 3 Losers = nhận round 2 winners losers + round 2 losers winners
UPDATE tournament_matches 
SET 
  round_number = 3,
  branch_type = 'A',
  loser_branch = 'A', 
  match_stage = 'losers_round_3_branch_a',
  updated_at = NOW()
WHERE tournament_id = (SELECT id FROM tournaments WHERE name = 'double6')
  AND bracket_type = 'losers'
  AND round_number = 103;

-- Round 4 Losers = Branch B
UPDATE tournament_matches 
SET 
  round_number = 4,
  branch_type = 'B',
  loser_branch = 'B',
  match_stage = 'losers_round_4_branch_b', 
  updated_at = NOW()
WHERE tournament_id = (SELECT id FROM tournaments WHERE name = 'double6')
  AND bracket_type = 'losers'
  AND round_number = 201;

-- Round 5 Losers = Final losers rounds
UPDATE tournament_matches 
SET 
  round_number = 5,
  branch_type = 'A',
  loser_branch = 'A',
  match_stage = 'losers_round_5_branch_a',
  updated_at = NOW()
WHERE tournament_id = (SELECT id FROM tournaments WHERE name = 'double6')
  AND bracket_type = 'losers'
  AND round_number = 202;

-- Verify the fix matches double1 structure
SELECT 
  'double6_fixed' as tournament,
  tm.round_number,
  tm.match_number, 
  tm.bracket_type,
  tm.branch_type,
  tm.loser_branch,
  tm.match_stage
FROM tournament_matches tm
JOIN tournaments t ON tm.tournament_id = t.id
WHERE t.name = 'double6'
  AND tm.bracket_type = 'losers'
ORDER BY tm.round_number, tm.match_number;