-- Check current constraint definition
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'challenges_score_confirmation_status_check';

-- Drop the old constraint and create a new one with all allowed values
ALTER TABLE public.challenges 
DROP CONSTRAINT IF EXISTS challenges_score_confirmation_status_check;

-- Add the updated constraint with all new enum values
ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_score_confirmation_status_check 
CHECK (score_confirmation_status IN ('pending', 'waiting_confirmation', 'completed', 'score_entered', 'score_confirmed', 'club_confirmed'));

-- Verify the constraint was created correctly
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'challenges_score_confirmation_status_check';