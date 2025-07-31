-- Debug: Check current loser bracket structure for this tournament
SELECT 
  bracket_type,
  branch_type,
  round_number,
  match_number,
  player1_id,
  player2_id,
  status,
  id
FROM tournament_matches 
WHERE tournament_id = '67e4abbe-e783-4576-b14e-1f7fe6bc6da8'
  AND bracket_type IN ('loser', 'loser_a', 'loser_b')
ORDER BY bracket_type, round_number, match_number;

-- Also check winner bracket completed matches
SELECT 
  'winner' as bracket_type,
  round_number,
  match_number,
  player1_id,
  player2_id,
  winner_id,
  status
FROM tournament_matches 
WHERE tournament_id = '67e4abbe-e783-4576-b14e-1f7fe6bc6da8'
  AND bracket_type = 'winner'
  AND status = 'completed'
ORDER BY round_number, match_number;