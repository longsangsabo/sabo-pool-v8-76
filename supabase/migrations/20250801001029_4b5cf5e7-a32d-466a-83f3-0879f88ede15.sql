-- Add club_id column to challenges table
ALTER TABLE public.challenges 
ADD COLUMN club_id UUID;

-- Create foreign key constraint to club_profiles
ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_club_id_fkey 
FOREIGN KEY (club_id) REFERENCES public.club_profiles(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_challenges_club_id ON public.challenges(club_id);

-- Update existing challenges to link them to clubs based on challenger's location/club
-- This is optional and can be done later if needed
COMMENT ON COLUMN public.challenges.club_id IS 'Club where the challenge takes place';