-- First update all non-standard status values to valid ones
UPDATE tournaments SET status = 'registration_open' WHERE status NOT IN ('draft', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled');

-- Now add the constraint
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;
ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check 
CHECK (status IN ('draft', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'));