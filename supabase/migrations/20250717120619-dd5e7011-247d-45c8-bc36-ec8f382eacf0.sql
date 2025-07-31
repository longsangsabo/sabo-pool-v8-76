-- Create temporary "allow all" policy for tournament_matches to fix score submission
-- This will allow users to update match scores until proper RLS policies are established

CREATE POLICY "Allow all operations on tournament matches" 
ON public.tournament_matches 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);