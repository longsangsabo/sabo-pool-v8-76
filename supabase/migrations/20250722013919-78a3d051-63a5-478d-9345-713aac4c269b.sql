-- Fix foreign key constraint for tournament_registrations table
-- Drop existing constraints if they exist
ALTER TABLE public.tournament_registrations 
DROP CONSTRAINT IF EXISTS tournament_registrations_user_id_fkey;

ALTER TABLE public.tournament_registrations 
DROP CONSTRAINT IF EXISTS tournament_registrations_player_id_fkey;

-- Clean up any orphaned registrations first
DELETE FROM public.tournament_registrations 
WHERE user_id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL);

-- Add proper foreign key constraint using user_id
ALTER TABLE public.tournament_registrations 
ADD CONSTRAINT tournament_registrations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;