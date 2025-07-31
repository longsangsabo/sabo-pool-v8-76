-- Drop existing conflicting policies on tournament_matches
DROP POLICY IF EXISTS "Everyone can view tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Admins and club owners can update tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "System can insert tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Admins can delete tournament matches" ON public.tournament_matches;

-- Create comprehensive admin bypass policy for all operations
CREATE POLICY "Admin bypass all tournament match operations" 
ON public.tournament_matches 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (is_admin = true OR role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (is_admin = true OR role = 'admin')
  )
);

-- Create separate policy for non-admin users to view matches
CREATE POLICY "Everyone can view tournament matches"
ON public.tournament_matches 
FOR SELECT
TO authenticated
USING (true);

-- Allow system/service to insert matches (for tournament creation)
CREATE POLICY "System can insert tournament matches"
ON public.tournament_matches 
FOR INSERT
TO authenticated
WITH CHECK (true);