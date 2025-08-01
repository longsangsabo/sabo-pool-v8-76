-- Add foreign key constraints for challenges table to establish proper relationships
-- This will allow Supabase to recognize the relationships between challenges and profiles

-- Add foreign key constraint for challenger_id
ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_challenger_id_fkey 
FOREIGN KEY (challenger_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for opponent_id  
ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_opponent_id_fkey 
FOREIGN KEY (opponent_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update the relationship mapping to ensure consistency
COMMENT ON CONSTRAINT challenges_challenger_id_fkey ON public.challenges IS 'Foreign key relationship to auth.users for challenger';
COMMENT ON CONSTRAINT challenges_opponent_id_fkey ON public.challenges IS 'Foreign key relationship to auth.users for opponent';