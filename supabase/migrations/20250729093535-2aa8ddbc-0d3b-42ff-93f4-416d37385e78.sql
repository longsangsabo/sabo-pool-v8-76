-- Fix all remaining matches with same player assigned to both positions
UPDATE tournament_matches 
SET player1_id = NULL, player2_id = NULL, status = 'pending'
WHERE player1_id = player2_id 
  AND player1_id IS NOT NULL 
  AND tournament_id = '6c170252-1108-409a-884d-4060c0269cb3';

-- Comprehensive repair of the double elimination bracket
SELECT repair_double_elimination_bracket_v2('6c170252-1108-409a-884d-4060c0269cb3') as repair_result;