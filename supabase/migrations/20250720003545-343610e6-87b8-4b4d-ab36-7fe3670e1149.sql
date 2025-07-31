-- Fix duplicate policy error and continue audit
-- First drop existing policies that might conflict
DROP POLICY IF EXISTS "Club owners can manage their tournaments" ON tournaments;
DROP POLICY IF EXISTS "Club owners can create tournaments" ON tournaments;
DROP POLICY IF EXISTS "Club owners can manage tournament matches" ON tournament_matches;

-- Now create the policies properly
CREATE POLICY "Club owners can create tournaments" 
ON tournaments FOR INSERT 
WITH CHECK (has_club_access('tournament_create', club_id));

CREATE POLICY "Club owners can manage their tournaments" 
ON tournaments FOR UPDATE 
USING (has_club_access('tournament_manage', club_id))
WITH CHECK (has_club_access('tournament_manage', club_id));

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