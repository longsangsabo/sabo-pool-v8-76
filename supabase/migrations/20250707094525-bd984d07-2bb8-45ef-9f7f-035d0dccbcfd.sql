-- Add missing columns to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'I' CHECK (tier IN ('G', 'H', 'I', 'K')),
ADD COLUMN IF NOT EXISTS min_rank_requirement text,
ADD COLUMN IF NOT EXISTS max_rank_requirement text,
ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tournament_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS tournament_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS registration_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS venue_name text;

-- Update existing data to use new columns (copy from old columns if they exist)
UPDATE public.tournaments SET 
  tournament_start = COALESCE(tournament_start, start_date),
  tournament_end = COALESCE(tournament_end, end_date),
  registration_end = COALESCE(registration_end, registration_deadline)
WHERE tournament_start IS NULL OR tournament_end IS NULL OR registration_end IS NULL;

-- Enable RLS if not already enabled
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view public tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Authenticated users can create tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Tournament creators can update their tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Tournament creators can delete their tournaments" ON public.tournaments;

-- Create new RLS policies
CREATE POLICY "Anyone can view public tournaments"
ON public.tournaments
FOR SELECT
USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create tournaments"
ON public.tournaments
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Tournament creators can update their tournaments"
ON public.tournaments
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Tournament creators can delete their tournaments"
ON public.tournaments
FOR DELETE
USING (auth.uid() = created_by);

-- Ensure created_by is set for existing tournaments without it
UPDATE public.tournaments 
SET created_by = auth.uid() 
WHERE created_by IS NULL;