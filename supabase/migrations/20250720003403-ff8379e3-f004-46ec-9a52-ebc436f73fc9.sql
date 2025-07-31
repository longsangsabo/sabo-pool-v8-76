-- FIX CRITICAL SECURITY ISSUES - Club Management Comprehensive Audit

-- 1. ENABLE RLS ON club_profiles (CRITICAL ERROR)
ALTER TABLE public.club_profiles ENABLE ROW LEVEL SECURITY;

-- 2. CREATE comprehensive club owner verification function
CREATE OR REPLACE FUNCTION public.is_club_owner(p_club_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If specific club_id provided, check ownership of that club
  IF p_club_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM club_profiles 
      WHERE id = p_club_id AND user_id = v_user_id
    );
  END IF;
  
  -- If no club_id provided, check if user owns any club
  RETURN EXISTS (
    SELECT 1 FROM club_profiles 
    WHERE user_id = v_user_id
  );
END;
$$;

-- 3. CREATE function to get user's club id
CREATE OR REPLACE FUNCTION public.get_user_club_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_club_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT id INTO v_club_id
  FROM club_profiles 
  WHERE user_id = v_user_id
  LIMIT 1;
  
  RETURN v_club_id;
END;
$$;

-- 4. CREATE comprehensive access control for club features
CREATE OR REPLACE FUNCTION public.has_club_access(p_feature TEXT, p_club_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_is_club_owner BOOLEAN;
  v_club_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin
  FROM profiles 
  WHERE user_id = v_user_id;
  
  -- Admins have access to everything
  IF v_is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Get club_id if not provided
  IF p_club_id IS NULL THEN
    v_club_id := get_user_club_id();
  ELSE
    v_club_id := p_club_id;
  END IF;
  
  -- Check if user owns the club
  v_is_club_owner := is_club_owner(v_club_id);
  
  -- Feature-based access control
  CASE p_feature
    WHEN 'tournament_create' THEN
      RETURN v_is_club_owner;
    WHEN 'tournament_manage' THEN
      RETURN v_is_club_owner;
    WHEN 'bracket_manage' THEN
      RETURN v_is_club_owner;
    WHEN 'member_manage' THEN
      RETURN v_is_club_owner;
    WHEN 'financial_view' THEN
      RETURN v_is_club_owner;
    WHEN 'analytics_view' THEN
      RETURN v_is_club_owner;
    WHEN 'settings_manage' THEN
      RETURN v_is_club_owner;
    WHEN 'table_manage' THEN
      RETURN v_is_club_owner;
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- 5. UPDATE club_profiles policies for proper access control
DROP POLICY IF EXISTS "Users can insert their own club profile" ON club_profiles;
DROP POLICY IF EXISTS "Users can update their own club profile" ON club_profiles;
DROP POLICY IF EXISTS "Users can view all club profiles" ON club_profiles;

CREATE POLICY "Users can view all verified club profiles" 
ON club_profiles FOR SELECT 
USING (verification_status = 'verified' OR auth.uid() = user_id OR is_current_user_admin());

CREATE POLICY "Users can insert their own club profile" 
ON club_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own club profile" 
ON club_profiles FOR UPDATE 
USING (auth.uid() = user_id OR is_current_user_admin())
WITH CHECK (auth.uid() = user_id OR is_current_user_admin());

-- 6. Enhanced club registration policies
DROP POLICY IF EXISTS "Users can insert their own club registrations" ON club_registrations;
DROP POLICY IF EXISTS "Users can update their own draft registrations" ON club_registrations;
DROP POLICY IF EXISTS "Users can view their own club registrations" ON club_registrations;
DROP POLICY IF EXISTS "Admins can view all club registrations" ON club_registrations;
DROP POLICY IF EXISTS "Admins can update club registrations" ON club_registrations;

CREATE POLICY "Users can view their own registrations or admins can view all"
ON club_registrations FOR SELECT
USING (auth.uid() = user_id OR is_current_user_admin());

CREATE POLICY "Users can insert their own club registrations"
ON club_registrations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update draft registrations or admins can update any"
ON club_registrations FOR UPDATE
USING ((auth.uid() = user_id AND status = 'draft') OR is_current_user_admin())
WITH CHECK ((auth.uid() = user_id AND status = 'draft') OR is_current_user_admin());

-- 7. Enhanced tournament policies for club owners
CREATE POLICY "Club owners can create tournaments" 
ON tournaments FOR INSERT 
WITH CHECK (has_club_access('tournament_create', club_id));

CREATE POLICY "Club owners can manage their tournaments" 
ON tournaments FOR UPDATE 
USING (has_club_access('tournament_manage', club_id))
WITH CHECK (has_club_access('tournament_manage', club_id));

-- 8. Enhanced tournament matches policies
CREATE POLICY "Club owners can manage tournament matches" 
ON tournament_matches FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM tournaments t 
    WHERE t.id = tournament_matches.tournament_id 
    AND has_club_access('bracket_manage', t.club_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tournaments t 
    WHERE t.id = tournament_matches.tournament_id 
    AND has_club_access('bracket_manage', t.club_id)
  )
);

-- 9. Enhanced club tables policies
DROP POLICY IF EXISTS "Club owners can manage their tables" ON club_tables;
DROP POLICY IF EXISTS "Everyone can view club tables" ON club_tables;

CREATE POLICY "Everyone can view club tables" 
ON club_tables FOR SELECT 
USING (true);

CREATE POLICY "Club owners can manage their tables" 
ON club_tables FOR ALL
USING (has_club_access('table_manage', club_id))
WITH CHECK (has_club_access('table_manage', club_id));