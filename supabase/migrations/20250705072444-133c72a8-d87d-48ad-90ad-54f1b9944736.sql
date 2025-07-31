-- Fix the admin check function to avoid RLS issues with auth.users table
-- Make it SECURITY DEFINER so it can access auth.users table

DROP FUNCTION IF EXISTS public.check_admin_on_profile_update();

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

-- Recreate the trigger
DROP TRIGGER IF EXISTS ensure_admin_status ON public.profiles;
CREATE TRIGGER ensure_admin_status
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_admin_on_profile_update();