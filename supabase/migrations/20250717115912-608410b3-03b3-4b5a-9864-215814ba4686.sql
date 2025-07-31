-- Drop all existing RLS policies on tournament_matches table
DROP POLICY IF EXISTS "Admin bypass all tournament match operations" ON public.tournament_matches;
DROP POLICY IF EXISTS "Everyone can view tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "System can insert tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Admins and club owners can update tournament matches" ON public.tournament_matches;
DROP POLICY IF EXISTS "Admins can delete tournament matches" ON public.tournament_matches;