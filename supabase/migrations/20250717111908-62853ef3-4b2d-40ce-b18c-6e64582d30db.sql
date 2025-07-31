-- Create security definer function to check user permissions safely
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_user_update_tournament_match(match_tournament_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check if user is admin
  IF public.is_current_user_admin() THEN
    RETURN true;
  END IF;
  
  -- Check if user is club owner of tournament
  IF EXISTS (
    SELECT 1 
    FROM public.club_profiles cp
    JOIN public.tournaments t ON t.club_id = cp.id
    WHERE t.id = match_tournament_id AND cp.user_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user created the tournament
  IF EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = match_tournament_id AND t.created_by = auth.uid()
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Drop and recreate RLS policies using security definer functions
DROP POLICY IF EXISTS "Admins and club owners can update tournament matches" ON public.tournament_matches;

CREATE POLICY "Admins and club owners can update tournament matches"
ON public.tournament_matches FOR UPDATE
USING (public.can_user_update_tournament_match(tournament_id));