-- Fix tournament status from 'upcoming' to 'registration_open' since we removed upcoming status
UPDATE tournaments 
SET status = 'registration_open' 
WHERE status = 'upcoming';