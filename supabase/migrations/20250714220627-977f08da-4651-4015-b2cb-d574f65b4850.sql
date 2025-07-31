-- Now that the function is fixed, update existing tournaments with missing club_id
UPDATE public.tournaments 
SET club_id = cp.id,
    updated_at = NOW()
FROM public.club_profiles cp
WHERE tournaments.club_id IS NULL 
  AND tournaments.created_by = cp.user_id
  AND cp.deleted_at IS NULL;