
-- First, let's check what values are allowed for registration_status
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname LIKE '%registration_status_check%' 
AND conrelid = 'tournament_registrations'::regclass;

-- Drop the existing constraint if it's too restrictive
ALTER TABLE tournament_registrations 
DROP CONSTRAINT IF EXISTS tournament_registrations_registration_status_check;

-- Add a new constraint that allows the values we're using
ALTER TABLE tournament_registrations 
ADD CONSTRAINT tournament_registrations_registration_status_check 
CHECK (registration_status IN ('pending', 'confirmed', 'cancelled', 'waitlist'));

-- Also check payment_status constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname LIKE '%payment_status_check%' 
AND conrelid = 'tournament_registrations'::regclass;

-- Update payment_status constraint if needed
ALTER TABLE tournament_registrations 
DROP CONSTRAINT IF EXISTS tournament_registrations_payment_status_check;

ALTER TABLE tournament_registrations 
ADD CONSTRAINT tournament_registrations_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled'));
