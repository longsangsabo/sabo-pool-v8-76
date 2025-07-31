-- Fix automation for verified_rank synchronization between profiles and player_rankings

-- 1. Create missing trigger on profiles table
CREATE TRIGGER trigger_sync_verified_rank_to_player_rankings
  AFTER UPDATE OF verified_rank ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_verified_rank_to_player_rankings();

-- 2. Sync existing data from profiles to player_rankings
UPDATE public.player_rankings 
SET verified_rank = p.verified_rank,
    updated_at = NOW()
FROM public.profiles p 
WHERE player_rankings.user_id = p.user_id 
AND (player_rankings.verified_rank IS NULL OR player_rankings.verified_rank != p.verified_rank OR p.verified_rank IS NULL);

-- 3. Create index to improve sync performance
CREATE INDEX IF NOT EXISTS idx_profiles_verified_rank_sync 
ON public.profiles(user_id, verified_rank) 
WHERE verified_rank IS NOT NULL;

-- 4. Log completion
DO $$
BEGIN
  RAISE NOTICE 'Verified rank automation completed successfully';
  RAISE NOTICE 'Trigger created: trigger_sync_verified_rank_to_player_rankings';
  RAISE NOTICE 'Data synchronized between profiles and player_rankings';
END $$;