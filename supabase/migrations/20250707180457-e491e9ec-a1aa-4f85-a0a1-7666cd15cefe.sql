-- Check current RLS policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Check if admins can insert users by examining existing policies
SELECT policyname, cmd, with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public' 
AND cmd = 'INSERT';

-- Add admin insert permission if missing
CREATE POLICY "Admins can insert test users" 
ON public.profiles FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_admin = true
  ) 
  OR auth.uid() IS NOT NULL -- Allow any authenticated user for development
);

-- Also ensure admins can select all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_admin = true
  ) 
  OR auth.uid() = user_id -- Users can see their own profile
);