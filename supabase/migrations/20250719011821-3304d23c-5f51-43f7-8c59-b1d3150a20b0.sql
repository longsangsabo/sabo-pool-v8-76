-- Clean and recreate matches with explicit UUID casting
DELETE FROM tournament_matches WHERE tournament_id = 'baaadc65-8a64-4d82-aa95-5a8db8662daa'::uuid;
SELECT public.create_double_elimination_bracket_v2('baaadc65-8a64-4d82-aa95-5a8db8662daa'::uuid);