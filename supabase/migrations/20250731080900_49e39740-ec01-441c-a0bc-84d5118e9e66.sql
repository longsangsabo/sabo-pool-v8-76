-- Add missing foreign key constraints to challenges table
ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_challenger_id_fkey 
FOREIGN KEY (challenger_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_opponent_id_fkey 
FOREIGN KEY (opponent_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;