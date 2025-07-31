-- Add position column to tournament_results table
ALTER TABLE public.tournament_results 
ADD COLUMN position INTEGER;