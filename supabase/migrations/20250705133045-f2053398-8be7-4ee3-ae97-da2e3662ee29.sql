-- Fix RLS policies for club_registrations to use is_admin instead of role
DROP POLICY IF EXISTS "Admins can view all club registrations" ON public.club_registrations;
DROP POLICY IF EXISTS "Admins can update club registrations" ON public.club_registrations;

-- Create new admin policies using is_admin field
CREATE POLICY "Admins can view all club registrations" 
  ON public.club_registrations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can update club registrations" 
  ON public.club_registrations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );