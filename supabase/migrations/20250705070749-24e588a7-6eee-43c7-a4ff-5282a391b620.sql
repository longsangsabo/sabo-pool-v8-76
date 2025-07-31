-- Fix infinite recursion by dropping problematic policies first
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.profiles;

-- Create security definer function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create safe admin policies using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY "Admins can update user profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (public.is_current_user_admin());

-- Also create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.get_user_admin_status(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT is_admin FROM public.profiles WHERE user_id = user_uuid),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;