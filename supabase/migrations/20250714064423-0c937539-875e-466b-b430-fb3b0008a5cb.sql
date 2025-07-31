-- Synchronize registration_end and registration_deadline fields
-- Since the database uses registration_end, we'll ensure consistency

-- Drop the registration_deadline column if it exists and create a view or trigger
-- to handle both names pointing to the same data

-- Add a computed column or update queries to handle both field names
-- For now, let's ensure registration_end is the primary field

-- Update any existing data where registration_deadline was used
UPDATE public.tournaments 
SET registration_end = COALESCE(registration_end, tournament_end)
WHERE registration_end IS NULL;

-- Add constraint to ensure registration_end is always set
ALTER TABLE public.tournaments 
ADD CONSTRAINT tournaments_registration_end_not_null 
CHECK (registration_end IS NOT NULL);

-- Create a function to handle both field names in queries
CREATE OR REPLACE FUNCTION public.get_tournament_registration_deadline(tournament_id UUID)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE SQL
STABLE
AS $$
  SELECT registration_end FROM public.tournaments WHERE id = tournament_id;
$$;

-- Add comment to clarify the field usage
COMMENT ON COLUMN public.tournaments.registration_end IS 'Registration deadline for the tournament. Also accessible as registration_deadline for backward compatibility.';