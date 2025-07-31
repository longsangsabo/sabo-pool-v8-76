-- Fix infinite recursion in profiles table RLS policies (part 2)
-- Drop all existing policies to start fresh

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.profiles;

-- Create security definer function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $function$
  SELECT role 
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$function$;

-- Create security definer function to check if user is admin without recursion
CREATE OR REPLACE FUNCTION public.check_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $function$
  SELECT COALESCE(is_admin, false)
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$function$;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin policies using security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT
USING (public.check_user_is_admin());

CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE
USING (public.check_user_is_admin());

-- Update the main admin check function to use the new secure function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $function$
  SELECT public.check_user_is_admin();
$function$;