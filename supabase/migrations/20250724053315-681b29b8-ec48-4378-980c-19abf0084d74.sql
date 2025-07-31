-- Test the new Double Elimination Bracket structure with sabo12 tournament
-- Clear existing matches and recreate with correct architecture

DELETE FROM tournament_matches WHERE tournament_id = 'baaadc65-8a64-4d82-aa95-5a8db8662daa';

-- Recreate bracket with new architecture
SELECT public.create_double_elimination_bracket_v2('baaadc65-8a64-4d82-aa95-5a8db8662daa');

-- Check the results
SELECT 
  bracket_type,
  branch_type,
  round_number,
  match_number,
  COUNT(*) as match_count,
  COUNT(player1_id) as assigned_players
FROM tournament_matches 
WHERE tournament_id = 'baaadc65-8a64-4d82-aa95-5a8db8662daa'
GROUP BY bracket_type, branch_type, round_number, match_number
ORDER BY bracket_type, round_number, match_number;