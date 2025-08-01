-- Remove the incorrect foreign keys if they exist
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_challenger_id_fkey;
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_opponent_id_fkey;

-- Create the correct foreign keys pointing to profiles table
ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_challenger_id_fkey 
FOREIGN KEY (challenger_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_opponent_id_fkey 
FOREIGN KEY (opponent_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;