-- Fix payment_status constraint to allow cash_pending value
ALTER TABLE tournament_registrations 
DROP CONSTRAINT IF EXISTS tournament_registrations_payment_status_check;

-- Add updated constraint that includes cash_pending
ALTER TABLE tournament_registrations 
ADD CONSTRAINT tournament_registrations_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cash_pending', 'processing', 'unpaid'));