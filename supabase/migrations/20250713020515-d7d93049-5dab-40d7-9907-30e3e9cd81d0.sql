-- Fix exclusion constraint to only prevent multiple pending requests
-- Drop existing constraint and create new one that allows progression
ALTER TABLE public.rank_requests DROP CONSTRAINT IF EXISTS unique_active_rank_request;

-- Create new constraint that only prevents multiple pending requests
-- This allows users to request higher ranks after approval
ALTER TABLE public.rank_requests 
ADD CONSTRAINT unique_pending_rank_request 
EXCLUDE (user_id WITH =, club_id WITH =) WHERE (status = 'pending');

-- Ensure requested_rank is integer type for consistency
ALTER TABLE public.rank_requests 
ALTER COLUMN requested_rank TYPE integer USING requested_rank::integer;