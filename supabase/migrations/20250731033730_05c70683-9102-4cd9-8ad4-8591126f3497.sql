-- Fix RLS policies for tournament_reward_templates to allow personal templates

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Club owners can manage their reward templates" ON tournament_reward_templates;

-- Add new policies that allow authenticated users to manage their own templates
CREATE POLICY "Users can view reward templates" 
ON tournament_reward_templates 
FOR SELECT 
TO authenticated
USING (
  is_active = true AND (
    club_id IS NULL OR 
    created_by = auth.uid() OR
    club_id IN (
      SELECT club_profiles.id 
      FROM club_profiles 
      WHERE club_profiles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create personal reward templates" 
ON tournament_reward_templates 
FOR INSERT 
TO authenticated
WITH CHECK (
  club_id IS NULL AND created_by = auth.uid()
);

CREATE POLICY "Users can update their own reward templates" 
ON tournament_reward_templates 
FOR UPDATE 
TO authenticated
USING (
  created_by = auth.uid() OR
  club_id IN (
    SELECT club_profiles.id 
    FROM club_profiles 
    WHERE club_profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  created_by = auth.uid() OR
  club_id IN (
    SELECT club_profiles.id 
    FROM club_profiles 
    WHERE club_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own reward templates" 
ON tournament_reward_templates 
FOR DELETE 
TO authenticated
USING (
  created_by = auth.uid() OR
  club_id IN (
    SELECT club_profiles.id 
    FROM club_profiles 
    WHERE club_profiles.user_id = auth.uid()
  )
);