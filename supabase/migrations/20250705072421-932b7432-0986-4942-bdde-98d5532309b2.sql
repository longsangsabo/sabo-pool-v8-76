-- Fix the admin check function to avoid RLS issues with auth.users table
-- Make it SECURITY DEFINER so it can access auth.users table

CREATE OR REPLACE FUNCTION public.check_admin_on_profile_update()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get email from auth.users table with SECURITY DEFINER permissions
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = NEW.user_id;
  
  -- Check if phone number OR email is in admin list
  IF NEW.phone IN ('0961167717', '0798893333') 
     OR user_email IN ('longsangsabo@gmail.com', 'longsang063@gmail.com') THEN
    NEW.is_admin := true;
  ELSE 
    NEW.is_admin := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure the profiles table has correct RLS policies
-- Drop and recreate the policies to be more explicit

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create clear and explicit policies
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow system to create profiles (for new user trigger)
CREATE POLICY "System can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);