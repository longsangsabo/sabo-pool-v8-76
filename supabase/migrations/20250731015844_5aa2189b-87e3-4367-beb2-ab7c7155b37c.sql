-- Update tournaments status check constraint to allow 'draft'
ALTER TABLE public.tournaments 
DROP CONSTRAINT IF EXISTS tournaments_status_check;

-- Recreate constraint with 'draft' status allowed
ALTER TABLE public.tournaments 
ADD CONSTRAINT tournaments_status_check 
CHECK (status IN ('upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled', 'draft'));