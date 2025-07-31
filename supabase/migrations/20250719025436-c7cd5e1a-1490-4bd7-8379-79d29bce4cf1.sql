
-- Fix tournament_type default value to prevent overriding user selection
ALTER TABLE public.tournaments 
ALTER COLUMN tournament_type DROP DEFAULT;

-- Add a check to ensure tournament_type is properly set
UPDATE public.tournaments 
SET tournament_type = 'single_elimination' 
WHERE tournament_type IS NULL;

-- Add NOT NULL constraint after cleaning up NULL values
ALTER TABLE public.tournaments 
ALTER COLUMN tournament_type SET NOT NULL;
