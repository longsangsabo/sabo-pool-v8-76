-- Fix RLS policies for tournament_registrations to allow admin insertion

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Admin can insert tournament registrations" ON tournament_registrations;
DROP POLICY IF EXISTS "Users can register for tournaments" ON tournament_registrations;

-- Create new policies that allow admin access
CREATE POLICY "Admin can manage tournament registrations" 
ON tournament_registrations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
  OR 
  auth.uid() = user_id
);

-- Allow users to register themselves
CREATE POLICY "Users can register themselves for tournaments"
ON tournament_registrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own registrations
CREATE POLICY "Users can view their own registrations"
ON tournament_registrations
FOR SELECT
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

-- Allow users to update their own registrations
CREATE POLICY "Users can update their own registrations"
ON tournament_registrations
FOR UPDATE
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));