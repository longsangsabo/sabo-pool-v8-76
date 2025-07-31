-- Add admin policy for tournament registrations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tournament_registrations' 
    AND policyname = 'Admins can manage all tournament registrations'
  ) THEN
    CREATE POLICY "Admins can manage all tournament registrations" 
    ON public.tournament_registrations FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    ));
  END IF;
END $$;