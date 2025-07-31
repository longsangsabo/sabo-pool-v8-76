-- Remove 'draft' status completely and ensure only valid statuses exist

-- First, update any tournaments with invalid or 'draft' status to 'registration_open'
UPDATE public.tournaments 
SET status = 'registration_open'
WHERE status NOT IN ('registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled');

-- Remove any existing constraints on tournaments table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT constraint_name FROM information_schema.table_constraints 
              WHERE table_name = 'tournaments' AND constraint_type = 'CHECK')
    LOOP
        EXECUTE 'ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS ' || r.constraint_name;
    END LOOP;
END $$;

-- Add the proper status constraint (without 'draft')
ALTER TABLE public.tournaments 
ADD CONSTRAINT tournaments_status_check 
CHECK (status IN ('registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'));

-- Set default status to 'registration_open' 
ALTER TABLE public.tournaments 
ALTER COLUMN status SET DEFAULT 'registration_open';

-- Update tournament constants by removing draft references
COMMENT ON COLUMN public.tournaments.status IS 'Valid statuses: registration_open, registration_closed, ongoing, completed, cancelled';