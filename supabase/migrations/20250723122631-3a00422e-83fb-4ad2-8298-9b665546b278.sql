
-- Add foreign key constraint between rank_requests and profiles
ALTER TABLE public.rank_requests 
ADD CONSTRAINT rank_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key constraint between rank_requests and club_profiles  
ALTER TABLE public.rank_requests 
ADD CONSTRAINT rank_requests_club_id_fkey 
FOREIGN KEY (club_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;

-- Add approved_by foreign key constraint
ALTER TABLE public.rank_requests 
ADD CONSTRAINT rank_requests_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
