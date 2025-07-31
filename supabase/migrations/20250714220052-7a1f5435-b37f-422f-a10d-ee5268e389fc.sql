-- Simple fix for existing tournaments without club_id
-- Link tournaments to their creators' clubs
WITH tournament_club_mapping AS (
  SELECT 
    t.id as tournament_id,
    cp.id as club_id
  FROM public.tournaments t
  JOIN public.club_profiles cp ON t.created_by = cp.user_id
  WHERE t.club_id IS NULL 
    AND cp.deleted_at IS NULL
)
UPDATE public.tournaments 
SET club_id = tcm.club_id,
    updated_at = NOW()
FROM tournament_club_mapping tcm
WHERE id = tcm.tournament_id;