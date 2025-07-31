-- Update RLS policies for tournaments to ensure proper visibility

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Anyone can view tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Users can create public tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Tournament creators can update their tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can manage all tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Club owners can manage their tournaments" ON public.tournaments;

-- Create comprehensive RLS policies for tournaments
CREATE POLICY "Anyone can view visible tournaments" 
ON public.tournaments 
FOR SELECT 
TO authenticated
USING (is_visible = true AND deleted_at IS NULL);

-- Allow authenticated users to create tournaments
CREATE POLICY "Authenticated users can create tournaments" 
ON public.tournaments 
FOR INSERT 
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  (
    (club_id IS NULL AND is_public = true) OR
    (club_id IN (
      SELECT club_profiles.id 
      FROM club_profiles 
      WHERE club_profiles.user_id = auth.uid()
    ))
  )
);

-- Allow tournament creators to update their tournaments
CREATE POLICY "Tournament creators can update their tournaments" 
ON public.tournaments 
FOR UPDATE 
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Allow admins to manage all tournaments
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

-- Allow club owners to manage tournaments at their clubs
CREATE POLICY "Club owners can manage club tournaments" 
ON public.tournaments 
FOR ALL 
TO authenticated
USING (
  club_id IN (
    SELECT club_profiles.id 
    FROM club_profiles 
    WHERE club_profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  club_id IN (
    SELECT club_profiles.id 
    FROM club_profiles 
    WHERE club_profiles.user_id = auth.uid()
  )
);