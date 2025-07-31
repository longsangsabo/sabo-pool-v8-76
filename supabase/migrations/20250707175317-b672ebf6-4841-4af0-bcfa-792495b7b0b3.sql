-- Check if there are triggers that might be causing the wallet creation issue
-- First, let's see if there's a trigger on profiles that creates wallet entries

-- Create a safer function to handle wallet creation on profile insert
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only create wallet if user_id is not null and doesn't already exist
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.wallets (user_id, balance, status)
    VALUES (NEW.user_id, 100.00, 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create or replace the trigger on profiles
DROP TRIGGER IF EXISTS create_wallet_on_profile_insert ON public.profiles;
CREATE TRIGGER create_wallet_on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();