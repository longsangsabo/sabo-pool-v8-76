-- Fix foreign key constraint issues for tournament deletion
-- Add CASCADE DELETE to all tournament foreign key constraints

-- First, let's check what foreign key constraints exist
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'tournaments'
    AND tc.table_schema = 'public';

-- Drop existing foreign key constraints and recreate with CASCADE DELETE
-- automation_performance_log
ALTER TABLE public.automation_performance_log 
DROP CONSTRAINT IF EXISTS automation_performance_log_tournament_id_fkey;

ALTER TABLE public.automation_performance_log 
ADD CONSTRAINT automation_performance_log_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;

-- tournament_matches
ALTER TABLE public.tournament_matches 
DROP CONSTRAINT IF EXISTS tournament_matches_tournament_id_fkey;

ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;

-- tournament_registrations
ALTER TABLE public.tournament_registrations 
DROP CONSTRAINT IF EXISTS tournament_registrations_tournament_id_fkey;

ALTER TABLE public.tournament_registrations 
ADD CONSTRAINT tournament_registrations_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;

-- tournament_brackets
ALTER TABLE public.tournament_brackets 
DROP CONSTRAINT IF EXISTS tournament_brackets_tournament_id_fkey;

ALTER TABLE public.tournament_brackets 
ADD CONSTRAINT tournament_brackets_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;

-- tournament_seeding
ALTER TABLE public.tournament_seeding 
DROP CONSTRAINT IF EXISTS tournament_seeding_tournament_id_fkey;

ALTER TABLE public.tournament_seeding 
ADD CONSTRAINT tournament_seeding_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;

-- tournament_results
ALTER TABLE public.tournament_results 
DROP CONSTRAINT IF EXISTS tournament_results_tournament_id_fkey;

ALTER TABLE public.tournament_results 
ADD CONSTRAINT tournament_results_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;

-- live_streams
ALTER TABLE public.live_streams 
DROP CONSTRAINT IF EXISTS live_streams_tournament_id_fkey;

ALTER TABLE public.live_streams 
ADD CONSTRAINT live_streams_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;

-- matches (if it has tournament_id)
ALTER TABLE public.matches 
DROP CONSTRAINT IF EXISTS matches_tournament_id_fkey;

ALTER TABLE public.matches 
ADD CONSTRAINT matches_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;

-- match_results (if it has tournament_id)
ALTER TABLE public.match_results 
DROP CONSTRAINT IF EXISTS match_results_tournament_id_fkey;

ALTER TABLE public.match_results 
ADD CONSTRAINT match_results_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;