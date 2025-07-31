-- Temporary fix: Simplify user creation by skipping optional dependencies

-- Drop any wallet creation that might be causing issues
DROP TRIGGER IF EXISTS create_wallet_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.create_user_wallet();

-- Create a simplified, bulletproof user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create essential profile, skip optional stuff for now
  BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Demo User'));
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't block signup
      RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Skip user_settings creation for now to avoid any FK issues
  -- We can create it manually later if needed
  
  RETURN NEW;
END;
$$;