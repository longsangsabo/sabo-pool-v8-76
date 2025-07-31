-- Fix status constraint that's blocking double elimination bracket creation
-- Check current constraint
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conrelid = 'tournament_matches'::regclass 
AND conname LIKE '%status%';

-- Drop the problematic constraint and recreate with proper values
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_status_check;
ALTER TABLE tournament_matches ADD CONSTRAINT tournament_matches_status_check 
CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'bye', 'pending'));

-- Now regenerate the bracket
SELECT public.generate_advanced_tournament_bracket('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 'elo_ranking', true);