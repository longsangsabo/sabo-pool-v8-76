-- Add policy to allow admins to create demo user profiles
CREATE POLICY "Admins can create demo user profiles" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Allow if the current user is an admin
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_admin = true
  )
  OR 
  -- Allow if the user being created is marked as demo user
  is_demo_user = true
);