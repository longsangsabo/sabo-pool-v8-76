-- Fix database consistency for verified_rank usage
-- This migration ensures all referenced columns exist and are properly indexed

-- 1. Check if verified_rank column exists in player_rankings table
DO $$
BEGIN
  -- Add verified_rank to player_rankings if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'player_rankings' 
    AND column_name = 'verified_rank' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.player_rankings 
    ADD COLUMN verified_rank TEXT DEFAULT 'K';
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_player_rankings_verified_rank 
    ON public.player_rankings(verified_rank);
    
    RAISE NOTICE 'Added verified_rank column to player_rankings table';
  ELSE
    RAISE NOTICE 'verified_rank column already exists in player_rankings table';
  END IF;
END $$;

-- 2. Sync verified_rank from profiles to player_rankings
UPDATE public.player_rankings 
SET verified_rank = COALESCE(p.verified_rank, 'K')
FROM public.profiles p 
WHERE player_rankings.user_id = p.user_id 
AND (player_rankings.verified_rank IS NULL OR player_rankings.verified_rank != COALESCE(p.verified_rank, 'K'));

-- 3. Create trigger to keep verified_rank in sync between tables
CREATE OR REPLACE FUNCTION sync_verified_rank_to_player_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update player_rankings when profiles.verified_rank changes
  UPDATE public.player_rankings 
  SET verified_rank = NEW.verified_rank,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_sync_verified_rank ON public.profiles;
CREATE TRIGGER trigger_sync_verified_rank
  AFTER UPDATE OF verified_rank ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_verified_rank_to_player_rankings();

-- 4. Ensure all indexes are in place for performance
CREATE INDEX IF NOT EXISTS idx_profiles_verified_rank ON public.profiles(verified_rank);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_id ON public.challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_opponent_id ON public.challenges(opponent_id);

-- 5. Update statistics
ANALYZE public.profiles;
ANALYZE public.player_rankings;
ANALYZE public.challenges;

-- 6. Log completion
DO $$
BEGIN
  RAISE NOTICE 'Database consistency fixes completed successfully';
  RAISE NOTICE 'All verified_rank references are now properly synchronized';
END $$;