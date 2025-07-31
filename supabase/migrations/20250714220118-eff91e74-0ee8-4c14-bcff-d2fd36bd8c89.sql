-- First, fix the update_club_stats function that's causing issues
-- The function is referencing non-existent columns in rank_verifications table
DROP FUNCTION IF EXISTS public.update_club_stats();

-- Now fix existing tournaments without club_id
-- Link tournaments to their creators' clubs  
UPDATE public.tournaments 
SET club_id = (
  SELECT cp.id 
  FROM public.club_profiles cp 
  WHERE cp.user_id = tournaments.created_by 
    AND cp.deleted_at IS NULL
  LIMIT 1
),
updated_at = NOW()
WHERE club_id IS NULL 
  AND created_by IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.club_profiles cp 
    WHERE cp.user_id = tournaments.created_by 
      AND cp.deleted_at IS NULL
  );