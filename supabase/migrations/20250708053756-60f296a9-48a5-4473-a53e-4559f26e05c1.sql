-- Fix wallet foreign key constraint issue

-- Drop any remaining wallet creation triggers
DROP TRIGGER IF EXISTS create_wallet_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.create_user_wallet();

-- Check if handle_new_user function is trying to create wallets
-- and update it to skip wallet creation completely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create essential profile, skip wallets and user_settings completely
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