-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS trigger_auto_validate_spa ON public.tournaments;
DROP TRIGGER IF EXISTS tournament_completion_spa_validation ON public.tournaments;
DROP FUNCTION IF EXISTS public.auto_validate_spa_on_tournament_complete() CASCADE;
DROP FUNCTION IF EXISTS public.validate_tournament_spa_calculations(uuid) CASCADE;