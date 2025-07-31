-- Update all existing tournaments with 'upcoming' status to 'registration_open'
UPDATE public.tournaments 
SET status = 'registration_open' 
WHERE status = 'upcoming';