-- Create proper RLS policies for tournament_matches table
-- Drop existing potentially problematic policies first
DROP POLICY IF EXISTS "Match participants can update their matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Players can update their match results" ON public.tournament_matches;
DROP POLICY IF EXISTS "Anyone can view tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Everyone can view tournament matches" ON public.tournament_matches;

-- Create comprehensive policies for tournament_matches
CREATE POLICY "Everyone can view tournament matches"
ON public.tournament_matches FOR SELECT
USING (true);

CREATE POLICY "Admins and club owners can update tournament matches"
ON public.tournament_matches FOR UPDATE
USING (
  -- Admins can update any match
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
  ))
  OR 
  -- Club owners can update matches for their tournaments
  (auth.uid() IN (
    SELECT cp.user_id 
    FROM public.club_profiles cp
    JOIN public.tournaments t ON t.club_id = cp.id
    WHERE t.id = tournament_matches.tournament_id
  ))
  OR
  -- Tournament creators can update matches for their tournaments
  (EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = tournament_matches.tournament_id AND t.created_by = auth.uid()
  ))
);

CREATE POLICY "System can insert tournament matches"
ON public.tournament_matches FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can delete tournament matches"
ON public.tournament_matches FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
  )
);