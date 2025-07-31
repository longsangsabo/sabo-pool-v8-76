-- Drop the problematic trigger temporarily
DROP TRIGGER IF EXISTS update_profile_completion_trigger ON public.profiles;

-- Update SABO PRO TEAM user rank to G
UPDATE public.profiles 
SET verified_rank = 'G'
WHERE user_id = 'b183caef-3ec8-4d3b-9d6a-d0ca4c14be72';