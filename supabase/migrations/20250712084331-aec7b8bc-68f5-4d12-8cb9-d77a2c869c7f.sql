-- Phase 1: Standardize player_rankings to use user_id instead of player_id

-- Step 1: Rename player_id column to user_id in player_rankings table
ALTER TABLE public.player_rankings 
RENAME COLUMN player_id TO user_id;

-- Step 2: Add proper foreign key constraint to profiles table
ALTER TABLE public.player_rankings 
ADD CONSTRAINT fk_player_rankings_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Step 3: Update indexes - drop old and create new
DROP INDEX IF EXISTS idx_player_rankings_player_id;
CREATE INDEX idx_player_rankings_user_id ON public.player_rankings(user_id);

-- Step 4: Update other tables that reference player_rankings
-- Update spa_points_log table
ALTER TABLE public.spa_points_log 
RENAME COLUMN player_id TO user_id;

-- Add foreign key constraint for spa_points_log
ALTER TABLE public.spa_points_log 
ADD CONSTRAINT fk_spa_points_log_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update elo_history table  
ALTER TABLE public.elo_history 
RENAME COLUMN player_id TO user_id;

-- Add foreign key constraint for elo_history
ALTER TABLE public.elo_history 
ADD CONSTRAINT fk_elo_history_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update opponent_id in elo_history as well
ALTER TABLE public.elo_history 
RENAME COLUMN opponent_id TO opponent_user_id;

-- Add foreign key constraint for opponent_user_id
ALTER TABLE public.elo_history 
ADD CONSTRAINT fk_elo_history_opponent_user_id 
FOREIGN KEY (opponent_user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Update daily_challenge_stats table
ALTER TABLE public.daily_challenge_stats 
RENAME COLUMN player_id TO user_id;

-- Add foreign key constraint for daily_challenge_stats
ALTER TABLE public.daily_challenge_stats 
ADD CONSTRAINT fk_daily_challenge_stats_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update monthly_snapshots table
ALTER TABLE public.monthly_snapshots 
RENAME COLUMN player_id TO user_id;

-- Add foreign key constraint for monthly_snapshots
ALTER TABLE public.monthly_snapshots 
ADD CONSTRAINT fk_monthly_snapshots_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update favorite_opponents table
ALTER TABLE public.favorite_opponents 
RENAME COLUMN player_id TO user_id;

ALTER TABLE public.favorite_opponents 
RENAME COLUMN opponent_id TO opponent_user_id;

-- Add foreign key constraints for favorite_opponents
ALTER TABLE public.favorite_opponents 
ADD CONSTRAINT fk_favorite_opponents_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.favorite_opponents 
ADD CONSTRAINT fk_favorite_opponents_opponent_user_id 
FOREIGN KEY (opponent_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Step 5: Update the sync function to use the new column name
CREATE OR REPLACE FUNCTION public.sync_profile_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Create or update player ranking when profile is updated
  INSERT INTO public.player_rankings (user_id, updated_at)
  VALUES (NEW.user_id, NOW())
  ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;