-- Add is_admin column to profiles table
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Create function to check and set admin status based on email
CREATE OR REPLACE FUNCTION check_admin_on_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if email is in admin list by checking auth.users
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = NEW.user_id 
    AND email IN ('longsangsabo@gmail.com', 'longsang063@gmail.com')
  ) THEN
    NEW.is_admin := true;
  ELSE 
    NEW.is_admin := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set admin status
CREATE TRIGGER ensure_admin_status
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION check_admin_on_profile_update();

-- Update existing profiles for admin users based on email
UPDATE public.profiles 
SET is_admin = true 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('longsangsabo@gmail.com', 'longsang063@gmail.com')
);