
-- Delete incorrect matches with wrong bracket_type for tournament double-1
DELETE FROM tournament_matches 
WHERE tournament_id = 'baaadc65-8a64-4d82-aa95-5a8db8662daa' 
AND bracket_type = 'double';

-- Also delete any other existing matches to ensure clean slate
DELETE FROM tournament_matches 
WHERE tournament_id = 'baaadc65-8a64-4d82-aa95-5a8db8662daa';

-- Recreate the double elimination bracket with correct structure
SELECT public.create_double_elimination_bracket_v2('baaadc65-8a64-4d82-aa95-5a8db8662daa');
