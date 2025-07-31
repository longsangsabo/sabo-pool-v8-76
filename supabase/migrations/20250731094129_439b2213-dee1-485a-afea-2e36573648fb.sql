-- Fix infinite recursion in user_roles RLS policies by creating security definer functions

-- Create security definer function to safely check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Check if current user has admin role in user_roles table
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Create security definer function to check admin role for specific user
CREATE OR REPLACE FUNCTION public.has_admin_role(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Check if specified user has admin role
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$;

-- Drop existing RLS policies on user_roles if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create new RLS policies using security definer functions (no recursion)
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Update admin_actions policies to use new security definer function
DROP POLICY IF EXISTS "Admins can view admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;

CREATE POLICY "Admins can view admin actions" 
ON public.admin_actions 
FOR SELECT 
USING (public.is_current_user_admin());

CREATE POLICY "Admins can insert admin actions" 
ON public.admin_actions 
FOR INSERT 
WITH CHECK (public.is_current_user_admin());

-- Update other admin policies to use security definer functions
DROP POLICY IF EXISTS "Admins can update registrations" ON public.club_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.club_registrations;

CREATE POLICY "Admins can update registrations" 
ON public.club_registrations 
FOR UPDATE 
USING (public.is_current_user_admin());

CREATE POLICY "Admins can view all registrations" 
ON public.club_registrations 
FOR SELECT 
USING (public.is_current_user_admin());

-- Fix other admin-related policies that might cause recursion
DROP POLICY IF EXISTS "System can manage challenge stats" ON public.daily_challenge_stats;
CREATE POLICY "Admins can manage challenge stats" 
ON public.daily_challenge_stats 
FOR ALL 
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage ELO rules" ON public.elo_rules;
CREATE POLICY "Admins can manage ELO rules" 
ON public.elo_rules 
FOR ALL 
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());