-- Add missing has_bracket column to tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS has_bracket BOOLEAN DEFAULT false;

-- Test bracket creation again  
DELETE FROM tournament_matches WHERE tournament_id = 'baaadc65-8a64-4d82-aa95-5a8db8662daa';
SELECT public.create_double_elimination_bracket_v2('baaadc65-8a64-4d82-aa95-5a8db8662daa');