-- Remove all check constraints on tournaments table
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE contype = 'c' AND conrelid = 'tournaments'::regclass
    LOOP
        EXECUTE 'ALTER TABLE tournaments DROP CONSTRAINT ' || constraint_name;
    END LOOP;
END $$;

-- Update the status values to proper ones
UPDATE tournaments SET status = 'registration_open' WHERE status = 'upcoming';

-- Add back only the status constraint we need
ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check 
CHECK (status IN ('draft', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'));