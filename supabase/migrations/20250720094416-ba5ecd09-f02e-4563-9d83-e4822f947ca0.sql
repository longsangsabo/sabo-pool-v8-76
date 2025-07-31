-- Fix infinite recursion in profiles table RLS policies
-- The issue is that is_current_user_admin() function is calling profiles table which causes recursion

-- First, let's drop problematic policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE
USING (auth.uid() = user_id);

-- Simple admin policy using direct check instead of function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_admin = true
  )
);

CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_admin = true
  )
);

-- Create policy for inserting profiles
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update the admin check function to be simpler and avoid recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $function$
  SELECT COALESCE(
    (
      SELECT is_admin 
      FROM public.profiles 
      WHERE user_id = auth.uid()
      LIMIT 1
    ), 
    false
  );
$function$;