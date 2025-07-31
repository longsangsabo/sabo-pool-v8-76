-- First drop the old check constraint and create new one
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;

-- Add new constraint with correct status values
ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check 
CHECK (status IN ('draft', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'));

-- Now update the status from upcoming to registration_open
UPDATE tournaments 
SET status = 'registration_open' 
WHERE status = 'upcoming';