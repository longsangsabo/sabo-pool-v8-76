-- Drop old double elimination functions that are no longer needed
DROP FUNCTION IF EXISTS public.generate_double_elimination_bracket_complete CASCADE;
DROP FUNCTION IF EXISTS public.generate_double_elimination_bracket_complete_v2 CASCADE;
DROP FUNCTION IF EXISTS public.generate_double_elimination_bracket_complete_v3 CASCADE;
DROP FUNCTION IF EXISTS public.generate_double_elimination_bracket_complete_v4 CASCADE;
DROP FUNCTION IF EXISTS public.generate_double_elimination_bracket_complete_v5 CASCADE;
DROP FUNCTION IF EXISTS public.generate_double_elimination_bracket_complete_v6 CASCADE;
DROP FUNCTION IF EXISTS public.generate_double_elimination_bracket_complete_v7 CASCADE;

-- Also drop the old advance function as we now use the enhanced version
DROP FUNCTION IF EXISTS public.advance_winner_to_next_round CASCADE;

-- Remove old repair function as we now have v2
DROP FUNCTION IF EXISTS public.repair_double_elimination_bracket CASCADE;