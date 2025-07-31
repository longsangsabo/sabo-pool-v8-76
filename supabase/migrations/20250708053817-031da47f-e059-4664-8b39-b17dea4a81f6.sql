-- Fix wallet foreign key constraint issue - drop all wallet-related triggers and functions

-- Drop the dependent trigger first
DROP TRIGGER IF EXISTS ensure_user_wallet ON public.profiles;

-- Drop wallet creation triggers and functions with CASCADE
DROP TRIGGER IF EXISTS create_wallet_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.create_user_wallet() CASCADE;

-- Update handle_new_user function to be minimal and safe
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create essential profile, no wallets or user_settings
  BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Demo User'), NEW.email);
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't block signup
      RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;