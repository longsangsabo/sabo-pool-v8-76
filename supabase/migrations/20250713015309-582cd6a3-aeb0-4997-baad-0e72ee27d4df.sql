-- Create unique constraint with proper error handling
ALTER TABLE public.rank_verifications 
ADD CONSTRAINT unique_user_club_verification 
UNIQUE (user_id, club_id);