-- Add created_by column to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update existing tournaments to set created_by based on club ownership
UPDATE public.tournaments 
SET created_by = clubs.owner_id
FROM public.clubs 
WHERE public.tournaments.club_id = public.clubs.id
AND public.tournaments.created_by IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.tournaments.created_by IS 'User who created the tournament';