-- Step 1: Add email column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: First handle existing orphaned wallets by finding users without profiles
-- and create their profiles
WITH orphaned_users AS (
  SELECT DISTINCT w.user_id
  FROM public.wallets w
  LEFT JOIN public.profiles p ON w.user_id = p.user_id
  WHERE p.user_id IS NULL
    AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = w.user_id)
)
INSERT INTO public.profiles (user_id, created_at, updated_at)
SELECT user_id, now(), now()
FROM orphaned_users
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Now ensure all auth users have profiles
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