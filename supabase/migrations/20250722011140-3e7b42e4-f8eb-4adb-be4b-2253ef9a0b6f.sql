-- Add admin policy for tournament registrations to fix RLS issues

-- Create admin policy for inserting tournament registrations
CREATE POLICY "Admins can insert tournament registrations" 
ON tournament_registrations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Create admin policy for deleting tournament registrations  
CREATE POLICY "Admins can delete tournament registrations"
ON tournament_registrations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Update existing SELECT policy to allow admin access
DROP POLICY IF EXISTS "Users can view tournament registrations" ON tournament_registrations;

CREATE POLICY "Users and admins can view tournament registrations"
ON tournament_registrations
FOR SELECT
USING (
  true OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);