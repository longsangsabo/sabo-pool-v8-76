-- Add is_admin column to profiles table
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Create function to check and set admin status based on phone
CREATE OR REPLACE FUNCTION check_admin_on_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if phone number is in admin list
  IF NEW.phone IN ('0961167717', '0798893333') THEN
    NEW.is_admin := true;
  ELSE 
    NEW.is_admin := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set admin status
CREATE TRIGGER ensure_admin_status
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION check_admin_on_profile_update();

-- Update existing profiles for admin users based on phone
UPDATE public.profiles 
SET is_admin = true 
WHERE phone IN ('0961167717', '0798893333');