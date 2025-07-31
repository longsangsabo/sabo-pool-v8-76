-- Update admin checking function to work with email logins
-- First, update the function to check both email from auth.users and phone from profiles
CREATE OR REPLACE FUNCTION check_admin_on_profile_update()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get email from auth.users table
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
$$ LANGUAGE plpgsql;

-- Update existing profiles for admin users based on email as well
UPDATE public.profiles 
SET is_admin = true 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('longsangsabo@gmail.com', 'longsang063@gmail.com')
  OR phone IN ('0961167717', '0798893333')
);