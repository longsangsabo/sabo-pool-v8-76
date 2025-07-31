-- Fix remaining NULL bracket_type matches
UPDATE public.tournament_matches 
SET bracket_type = 'final'
WHERE tournament_id = '4847643a-316a-428b-9ac5-6f20e13d2ab3'
  AND bracket_type IS NULL;

-- Run comprehensive tournament recovery to fix all player assignments
SELECT public.recover_tournament_automation('4847643a-316a-428b-9ac5-6f20e13d2ab3');

-- Fix all tournament progression for this specific tournament
SELECT public.fix_all_tournament_progression('4847643a-316a-428b-9ac5-6f20e13d2ab3');