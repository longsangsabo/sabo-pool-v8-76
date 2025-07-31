-- Fix tournament_registrations_registration_status_check constraint
-- Drop the old constraint that doesn't include 'confirmed'
ALTER TABLE tournament_registrations DROP CONSTRAINT IF EXISTS tournament_registrations_registration_status_check;

-- Add new constraint that includes 'confirmed' status
ALTER TABLE tournament_registrations ADD CONSTRAINT tournament_registrations_registration_status_check 
CHECK (registration_status IN ('pending', 'confirmed', 'cancelled', 'waitlist'));