-- Fix RLS policies for tournaments table to allow proper tournament creation

-- Add policy to allow admins to manage all tournaments
CREATE POLICY "Admins can manage all tournaments" 
ON public.tournaments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Add policy to allow users to create public tournaments (not tied to clubs)
CREATE POLICY "Users can create public tournaments" 
ON public.tournaments 
FOR INSERT 
TO authenticated
WITH CHECK (
  (club_id IS NULL AND is_public = true AND created_by = auth.uid()) OR
  (club_id IN (
    SELECT clubs.id 
    FROM clubs 
    WHERE clubs.owner_id = auth.uid()
  ))
);

-- Add policy to allow tournament creators to update their own tournaments
CREATE POLICY "Tournament creators can update their tournaments" 
ON public.tournaments 
FOR UPDATE 
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());