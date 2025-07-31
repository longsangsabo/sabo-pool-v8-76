-- Completely remove all wallet creation triggers for test profiles

-- Drop all existing triggers that might create wallets
DROP TRIGGER IF EXISTS create_wallet_on_profile_insert ON public.profiles;
DROP TRIGGER IF EXISTS handle_new_profile ON public.profiles;
DROP TRIGGER IF EXISTS create_wallet_trigger ON public.profiles;
DROP TRIGGER IF EXISTS profile_wallet_trigger ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;

-- Drop all wallet creation functions
DROP FUNCTION IF EXISTS public.handle_new_profile() CASCADE;
DROP FUNCTION IF EXISTS public.create_wallet_for_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_profile_insert() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_wallet() CASCADE;

-- Check if there are any other triggers on profiles table
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'profiles' 
AND event_object_schema = 'public';

-- For future real user registrations, create a simple wallet creation function
-- that only works for authenticated users (not test profiles)
CREATE OR REPLACE FUNCTION public.create_wallet_for_real_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only create wallet if this is a real user (has user_id from auth.users)
  IF NEW.user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = NEW.user_id
  ) THEN
    INSERT INTO public.wallets (user_id, balance, status)
    VALUES (NEW.user_id, 100.00, 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail profile creation if wallet creation fails
    RAISE WARNING 'Could not create wallet for user %: %', NEW.user_id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger only for real users (not test profiles)
CREATE TRIGGER create_wallet_for_authenticated_users
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION public.create_wallet_for_real_users();