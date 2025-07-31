-- Fix RLS policy for automation_performance_log to allow system inserts
-- This will allow automated logging during tournament operations

-- Add policy to allow system/automated inserts to automation_performance_log
CREATE POLICY "Allow system inserts for automation logging" 
ON public.automation_performance_log 
FOR INSERT 
WITH CHECK (true);

-- Also ensure tournament_registrations has proper RLS policies
-- Check if tournament_registrations table has proper INSERT policy
DO $$
BEGIN
  -- Add INSERT policy for tournament_registrations if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tournament_registrations' 
    AND policyname = 'Users can register for tournaments'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can register for tournaments" 
    ON public.tournament_registrations 
    FOR INSERT 
    WITH CHECK (auth.uid() = player_id)';
  END IF;
END $$;