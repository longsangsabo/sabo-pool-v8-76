-- Fix existing tournaments without club_id by linking them to their creators' clubs
UPDATE public.tournaments 
SET club_id = cp.id,
    updated_at = NOW()
FROM public.club_profiles cp
WHERE tournaments.club_id IS NULL 
  AND tournaments.created_by = cp.user_id
  AND cp.deleted_at IS NULL;

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % tournaments with missing club_id', updated_count;
END $$;