-- Clean up all old double elimination functions and triggers to avoid conflicts

-- Drop old triggers first
DROP TRIGGER IF EXISTS trigger_advance_double_elimination_v9_auto ON tournament_matches;
DROP TRIGGER IF EXISTS advance_double_elimination_trigger ON tournament_matches;
DROP TRIGGER IF EXISTS auto_advance_trigger ON tournament_matches;

-- Drop old functions
DROP FUNCTION IF EXISTS public.trigger_advance_double_elimination_v9() CASCADE;
DROP FUNCTION IF EXISTS public.advance_double_elimination_v9(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.repair_double_elimination_bracket_v9(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fix_all_tournament_progression_v9(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.advance_winner_v9(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.advance_winners_v9(uuid) CASCADE;

-- Also clean up any other old tournament automation functions
DROP FUNCTION IF EXISTS public.advance_double_elimination_v8(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.advance_double_elimination_v7(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.advance_double_elimination_v6(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.advance_double_elimination_v5(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.advance_double_elimination_v4(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.advance_double_elimination_v3(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.advance_double_elimination_v2(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.advance_double_elimination_v1(uuid) CASCADE;

-- Clean up old repair functions
DROP FUNCTION IF EXISTS public.repair_double_elimination_bracket_v8(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.repair_double_elimination_bracket_v7(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.repair_double_elimination_bracket_v6(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.repair_double_elimination_bracket_v5(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.repair_double_elimination_bracket_v4(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.repair_double_elimination_bracket_v3(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.repair_double_elimination_bracket_v2(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.repair_double_elimination_bracket_v1(uuid) CASCADE;

-- Clean up old progression functions
DROP FUNCTION IF EXISTS public.fix_all_tournament_progression_v8(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fix_all_tournament_progression_v7(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fix_all_tournament_progression_v6(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fix_all_tournament_progression_v5(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fix_all_tournament_progression_v4(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fix_all_tournament_progression_v3(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fix_all_tournament_progression_v2(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fix_all_tournament_progression_v1(uuid) CASCADE;