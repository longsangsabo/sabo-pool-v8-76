-- Drop the existing trigger and function that's causing the wallet creation issue
DROP TRIGGER IF EXISTS create_wallet_on_profile_insert ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_profile();

-- Create a new function that only creates wallets for real users (with user_id)
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only create wallet if user_id is not null (real users, not test profiles)
  IF NEW.user_id IS NOT NULL THEN
    -- Check if wallet already exists
    IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE user_id = NEW.user_id) THEN
      INSERT INTO public.wallets (user_id, balance, status)
      VALUES (NEW.user_id, 100.00, 'active');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger only for profiles with user_id
CREATE TRIGGER create_wallet_on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_profile();