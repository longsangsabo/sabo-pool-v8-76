-- Kiểm tra current state của double6 sau repair
SELECT 
  tm.id,
  tm.round_number,
  tm.match_number, 
  tm.player1_id,
  tm.player2_id,
  tm.status,
  tm.bracket_type,
  tm.match_stage,
  tm.branch_type,
  tm.loser_branch
FROM tournament_matches tm
JOIN tournaments t ON tm.tournament_id = t.id
WHERE t.name = 'double6'
ORDER BY tm.bracket_type, tm.round_number, tm.match_number;

-- So sánh với double1 logic
SELECT 
  tm.id,
  tm.round_number,
  tm.match_number, 
  tm.player1_id,
  tm.player2_id,
  tm.status,
  tm.bracket_type,
  tm.match_stage,
  tm.branch_type,
  tm.loser_branch
FROM tournament_matches tm
JOIN tournaments t ON tm.tournament_id = t.id
WHERE t.name = 'double1'
ORDER BY tm.bracket_type, tm.round_number, tm.match_number;

-- Fix Loser's Branch A logic - chỉ nhận losers từ round 1 Winner's Bracket
-- Update matches trong losers bracket để có đúng branch logic
UPDATE tournament_matches 
SET 
  branch_type = 'A',
  loser_branch = 'A',
  match_stage = CASE 
    WHEN round_number = 1 AND bracket_type = 'losers' THEN 'losers_round_1_branch_a'
    WHEN round_number = 2 AND bracket_type = 'losers' THEN 'losers_round_2_branch_a'
    ELSE match_stage
  END,
  updated_at = NOW()
WHERE tournament_id = (SELECT id FROM tournaments WHERE name = 'double6')
  AND bracket_type = 'losers'
  AND round_number <= 2
  AND match_number <= 2; -- Assuming first 2 matches in losers are Branch A

-- Update remaining losers matches as Branch B (receive losers from round 2+ winners)
UPDATE tournament_matches 
SET 
  branch_type = 'B',
  loser_branch = 'B', 
  match_stage = CASE 
    WHEN round_number = 1 AND bracket_type = 'losers' THEN 'losers_round_1_branch_b'
    WHEN round_number = 2 AND bracket_type = 'losers' THEN 'losers_round_2_branch_b'
    ELSE match_stage
  END,
  updated_at = NOW()
WHERE tournament_id = (SELECT id FROM tournaments WHERE name = 'double6')
  AND bracket_type = 'losers'
  AND round_number <= 2
  AND match_number > 2;

-- Verify the fix
SELECT 
  'After Fix - double6' as tournament,
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