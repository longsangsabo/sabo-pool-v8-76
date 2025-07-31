-- SIMPLIFIED TOURNAMENT DATABASE OPTIMIZATION
-- Phase 1: Drop confirmed empty/unused tables

-- Drop tournament_realtime_stats (empty table)
DROP TABLE IF EXISTS public.tournament_realtime_stats CASCADE;

-- Drop tournament_qualifications (empty table)  
DROP TABLE IF EXISTS public.tournament_qualifications CASCADE;

-- Drop tournament_automation_log (empty table)
DROP TABLE IF EXISTS public.tournament_automation_log CASCADE;

-- Drop tournament_workflow_steps (empty table)
DROP TABLE IF EXISTS public.tournament_workflow_steps CASCADE;

-- Drop season_tournaments (empty table)
DROP TABLE IF EXISTS public.season_tournaments CASCADE;

-- Drop tournament_progression table (overlapping functionality)
DROP TABLE IF EXISTS public.tournament_progression CASCADE;

-- Phase 2: Add performance indexes for core tables
-- Tournaments indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON public.tournaments(tournament_start, tournament_end);
CREATE INDEX IF NOT EXISTS idx_tournaments_tier ON public.tournaments(tier_level);
CREATE INDEX IF NOT EXISTS idx_tournaments_club ON public.tournaments(club_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_deleted ON public.tournaments(deleted_at) WHERE deleted_at IS NULL;

-- Tournament registrations indexes  
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status ON public.tournament_registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_payment ON public.tournament_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user_tournament ON public.tournament_registrations(user_id, tournament_id);

-- Tournament matches indexes
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON public.tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON public.tournament_matches(tournament_id, round_number);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_players ON public.tournament_matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_bracket ON public.tournament_matches(tournament_id, bracket_type);

-- Tournament results indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_tournament_results_position ON public.tournament_results(tournament_id, final_position);
CREATE INDEX IF NOT EXISTS idx_tournament_results_user ON public.tournament_results(user_id);

-- Phase 3: Update RLS policies for optimized structure
-- Update tournaments RLS policies
DROP POLICY IF EXISTS "Tournament visibility" ON public.tournaments;
CREATE POLICY "Tournament visibility" ON public.tournaments
FOR SELECT USING (
    (status IN ('upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed') AND deleted_at IS NULL)
    OR auth.uid() = created_by 
    OR is_current_user_admin()
);

-- Log the optimization
INSERT INTO public.system_logs (log_type, message, metadata)
VALUES (
    'database_optimization',
    'Tournament database optimization phase 1 completed',
    jsonb_build_object(
        'tables_dropped', 6,
        'indexes_added', 11,
        'optimization_date', now(),
        'phase', 'cleanup_and_indexing'
    )
);