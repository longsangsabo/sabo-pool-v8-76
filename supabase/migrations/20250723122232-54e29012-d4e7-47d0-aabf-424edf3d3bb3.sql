-- Add INSERT policy for notifications table to allow system to create notifications
CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- Also allow admins to create notifications
CREATE POLICY "Admins can create notifications" ON public.notifications
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);