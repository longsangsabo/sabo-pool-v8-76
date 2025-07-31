-- Fix tournament_brackets status constraint to allow 'active' status
-- The current function uses 'active' but constraint only allows 'draft', 'generated', 'ongoing', 'completed'

-- Update the constraint to include 'active'
ALTER TABLE public.tournament_brackets DROP CONSTRAINT IF EXISTS tournament_brackets_status_check;

ALTER TABLE public.tournament_brackets 
ADD CONSTRAINT tournament_brackets_status_check 
CHECK (status IN ('draft', 'generated', 'ongoing', 'completed', 'active'));