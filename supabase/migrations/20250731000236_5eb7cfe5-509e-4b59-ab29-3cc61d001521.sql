-- Create RLS policies for tournament_prize_tiers table
ALTER TABLE public.tournament_prize_tiers ENABLE ROW LEVEL SECURITY;

-- Policy for viewing prize tiers
CREATE POLICY "Users can view tournament prize tiers" ON public.tournament_prize_tiers
FOR SELECT USING (
  -- Allow viewing for public tournaments
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    WHERE t.id = tournament_prize_tiers.tournament_id 
    AND t.is_public = true
  )
  OR
  -- Allow viewing for tournament organizers/club owners
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    JOIN public.club_profiles cp ON t.club_id = cp.id
    WHERE t.id = tournament_prize_tiers.tournament_id 
    AND cp.user_id = auth.uid()
  )
  OR
  -- Allow viewing for registered participants
  EXISTS (
    SELECT 1 FROM public.tournament_registrations tr
    WHERE tr.tournament_id = tournament_prize_tiers.tournament_id
    AND tr.user_id = auth.uid()
    AND tr.registration_status = 'confirmed'
  )
);

-- Policy for club owners to manage prize tiers
CREATE POLICY "Club owners can manage tournament prize tiers" ON public.tournament_prize_tiers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    JOIN public.club_profiles cp ON t.club_id = cp.id
    WHERE t.id = tournament_prize_tiers.tournament_id 
    AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    JOIN public.club_profiles cp ON t.club_id = cp.id
    WHERE t.id = tournament_prize_tiers.tournament_id 
    AND cp.user_id = auth.uid()
  )
);