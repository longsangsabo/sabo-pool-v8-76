-- Clean up remaining redundant double elimination functions
DROP FUNCTION IF EXISTS advance_simplified_double_elimination(uuid, uuid);
DROP FUNCTION IF EXISTS create_double_elimination_tournament(uuid);
DROP FUNCTION IF EXISTS get_double_elimination_next_loser_match(uuid, integer, integer);
DROP FUNCTION IF EXISTS get_double_elimination_next_winner_match(uuid, integer, integer);

-- Verify which functions are kept
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%double%elimination%'
ORDER BY routine_name;