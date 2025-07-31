-- Update tournament_matches status check constraint to include 'ready' and 'in_progress'
ALTER TABLE public.tournament_matches 
DROP CONSTRAINT tournament_matches_status_check;

ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_status_check 
CHECK (status = ANY (ARRAY['scheduled'::text, 'ready'::text, 'in_progress'::text, 'ongoing'::text, 'completed'::text, 'cancelled'::text]));