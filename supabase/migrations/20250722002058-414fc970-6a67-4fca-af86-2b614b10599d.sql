-- Fix constraint removal and update tournament status
UPDATE public.tournaments 
SET status = 'registration_open'
WHERE status NOT IN ('registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled');

-- Drop existing CHECK constraints properly
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Get all check constraints for tournaments table
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'tournaments' 
        AND table_schema = 'public'
        AND constraint_type = 'CHECK'
    )
    LOOP
        EXECUTE 'ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Add the proper status constraint (without 'draft')
ALTER TABLE public.tournaments 
ADD CONSTRAINT tournaments_status_check 
CHECK (status IN ('registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'));

-- Set default status to 'registration_open' 
ALTER TABLE public.tournaments 
ALTER COLUMN status SET DEFAULT 'registration_open';