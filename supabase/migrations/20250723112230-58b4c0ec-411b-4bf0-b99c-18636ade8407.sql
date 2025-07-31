-- Fix skill_level check constraint to match form values
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_skill_level_check;

-- Add new constraint with correct values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_skill_level_check 
CHECK (skill_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'expert'::text]));