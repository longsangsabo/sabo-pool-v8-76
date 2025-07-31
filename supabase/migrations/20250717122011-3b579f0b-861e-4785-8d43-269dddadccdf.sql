-- STEP 3: Backup for tournament RLS policy changes (safety first)
INSERT INTO public.migration_backups (affected_component, change_description, rollback_notes)
VALUES 
('tournament_matches RLS policies', 'Remove overly permissive allow-all policy and replace with proper security', 'If issues occur, can recreate temporary policy with: CREATE POLICY "temp_allow_all" ON public.tournament_matches FOR ALL TO public USING (true) WITH CHECK (true);');

-- Remove the overly permissive temporary policy
DROP POLICY IF EXISTS "Allow all operations on tournament matches" ON public.tournament_matches;