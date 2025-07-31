-- Create proper RLS policies for tournament_matches table
-- These replace the overly permissive "allow all" policy

-- 1. Anyone can view tournament matches (for bracket display)
CREATE POLICY "Anyone can view tournament matches"
ON public.tournament_matches
FOR SELECT 
TO public
USING (true);

-- 2. Tournament participants can update their match scores
CREATE POLICY "Participants can update match scores"
ON public.tournament_matches
FOR UPDATE
TO public
USING (
  auth.uid() IN (player1_id, player2_id)
)
WITH CHECK (
  auth.uid() IN (player1_id, player2_id)
);

-- 3. Tournament organizers can manage matches for their tournaments
CREATE POLICY "Tournament organizers can manage their matches"
ON public.tournament_matches
FOR ALL
TO public
USING (
  auth.uid() IN (
    SELECT t.created_by 
    FROM public.tournaments t 
    WHERE t.id = tournament_matches.tournament_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT t.created_by 
    FROM public.tournaments t 
    WHERE t.id = tournament_matches.tournament_id
  )
);