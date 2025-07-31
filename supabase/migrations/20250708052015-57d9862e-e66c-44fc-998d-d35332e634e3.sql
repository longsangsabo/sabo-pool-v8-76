-- Step 1: Fix profiles table structure first
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Ensure all existing auth users have profiles (without triggering other operations)
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

-- Step 3: Now we can safely add the email constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);