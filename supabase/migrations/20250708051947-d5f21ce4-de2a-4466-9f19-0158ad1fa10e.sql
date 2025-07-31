-- Fix profiles table - add missing email column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update profiles table to set email column as unique
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Drop the problematic user_settings foreign key constraint and recreate it properly
ALTER TABLE public.user_settings 
DROP CONSTRAINT IF EXISTS fk_user_settings_user;

-- Recreate the constraint properly - user_settings should reference profiles.user_id
ALTER TABLE public.user_settings 
ADD CONSTRAINT fk_user_settings_user 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Ensure all existing auth users have profiles
INSERT INTO public.profiles (user_id, created_at, updated_at)
SELECT 
  auth.users.id,
  now(),
  now()
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;