-- Delete existing matches for tournament double-1 and recreate double elimination bracket
DELETE FROM tournament_matches WHERE tournament_id = 'baaadc65-8a64-4d82-aa95-5a8db8662daa';

-- Now create the proper double elimination bracket
SELECT public.create_double_elimination_bracket_v2('baaadc65-8a64-4d82-aa95-5a8db8662daa');