-- Remove all remaining references to advance_sabo_tournament_fixed

-- First, drop the function completely
DROP FUNCTION IF EXISTS public.advance_sabo_tournament_fixed(uuid, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.advance_sabo_tournament_fixed(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.advance_sabo_tournament_fixed(uuid) CASCADE;

-- Also clean up any related functions that might call it
DROP FUNCTION IF EXISTS public.advance_tournament_like_double1(uuid, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.advance_simplified_double_elimination(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.submit_match_score(uuid, integer, integer, uuid) CASCADE;

-- List any remaining functions that might have references
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc LIKE '%advance_sabo_tournament_fixed%';