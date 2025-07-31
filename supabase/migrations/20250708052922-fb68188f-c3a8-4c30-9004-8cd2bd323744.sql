-- Fix race condition between profile and user_settings creation

-- Step 1: Drop the problematic foreign key constraint that references profiles
ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS fk_user_settings_user;

-- Step 2: Drop the separate user_settings trigger
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_settings();

-- Step 3: Update handle_new_user function to create both profile and user_settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profile first
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Then create user_settings (references auth.users directly)
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;