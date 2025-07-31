-- Fix the foreign key relationship issue in challenges table
-- The error suggests that Supabase cache can't find the relationship

-- First, let's check if there are any orphaned records
SELECT COUNT(*) as orphaned_challenger_records FROM challenges 
WHERE challenger_id NOT IN (SELECT user_id FROM profiles WHERE user_id IS NOT NULL);

SELECT COUNT(*) as orphaned_opponent_records FROM challenges 
WHERE opponent_id IS NOT NULL AND opponent_id NOT IN (SELECT user_id FROM profiles WHERE user_id IS NOT NULL);

-- Drop and recreate the foreign key constraints to ensure they're properly cached
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS fk_challenges_challenger;
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS fk_challenges_opponent;

-- Recreate the constraints with proper names and ensure they reference the correct columns
ALTER TABLE challenges 
ADD CONSTRAINT fk_challenges_challenger 
FOREIGN KEY (challenger_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE challenges 
ADD CONSTRAINT fk_challenges_opponent 
FOREIGN KEY (opponent_id) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';