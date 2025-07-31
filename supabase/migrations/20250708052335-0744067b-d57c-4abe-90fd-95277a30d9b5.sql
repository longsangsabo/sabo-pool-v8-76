-- Step 1: Temporarily disable the problematic trigger
ALTER TABLE public.profiles DISABLE TRIGGER ALL;

-- Step 2: Add email column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 3: Fix orphaned data - create profiles for users that have wallets but no profiles
INSERT INTO public.profiles (user_id, created_at, updated_at)
SELECT DISTINCT 
  w.user_id,
  now(),
  now()
FROM public.wallets w
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = w.user_id
)
AND EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = w.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Ensure all auth users have profiles
INSERT INTO public.profiles (user_id, created_at, updated_at)
SELECT 
  au.id,
  now(),
  now()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Re-enable triggers
ALTER TABLE public.profiles ENABLE TRIGGER ALL;