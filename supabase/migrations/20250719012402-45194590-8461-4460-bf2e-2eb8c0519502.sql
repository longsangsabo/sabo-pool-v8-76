-- Drop existing constraint and create new one that includes branch_type
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_unique_bracket_round_match;

-- Create new constraint that allows same round/match in different branches
ALTER TABLE tournament_matches ADD CONSTRAINT tournament_matches_unique_bracket_round_match 
UNIQUE (tournament_id, bracket_type, COALESCE(branch_type, ''), round_number, match_number);

-- Test the bracket creation again
DELETE FROM tournament_matches WHERE tournament_id = 'baaadc65-8a64-4d82-aa95-5a8db8662daa';
SELECT public.create_double_elimination_bracket_v2('baaadc65-8a64-4d82-aa95-5a8db8662daa');