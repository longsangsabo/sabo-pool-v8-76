-- Add foreign key constraint to link rank_requests with profiles
ALTER TABLE public.rank_requests 
ADD CONSTRAINT fk_rank_requests_user_id 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Add foreign key constraint to link rank_requests with club_profiles
ALTER TABLE public.rank_requests 
ADD CONSTRAINT fk_rank_requests_club_id 
FOREIGN KEY (club_id) 
REFERENCES public.club_profiles(id) 
ON DELETE CASCADE;