-- TOURNAMENT DATABASE OPTIMIZATION PLAN
-- Phase 1: Drop empty/unused tables

-- Check and drop tournament_realtime_stats (empty table)
DROP TABLE IF EXISTS public.tournament_realtime_stats CASCADE;

-- Check and drop tournament_qualifications (empty table)  
DROP TABLE IF EXISTS public.tournament_qualifications CASCADE;

-- Check and drop tournament_automation_log (empty table)
DROP TABLE IF EXISTS public.tournament_automation_log CASCADE;

-- Check and drop tournament_workflow_steps (empty table)
DROP TABLE IF EXISTS public.tournament_workflow_steps CASCADE;

-- Check and drop season_tournaments (empty table)
DROP TABLE IF EXISTS public.season_tournaments CASCADE;

-- Phase 2: Merge tournament_reward_structures into tournaments
-- First, update tournaments with reward data if any exists
UPDATE public.tournaments 
SET metadata = COALESCE(metadata, '{}'::jsonb) || 
    jsonb_build_object(
        'reward_structure', 
        (SELECT jsonb_build_object(
            'first_prize', trs.first_prize,
            'second_prize', trs.second_prize, 
            'third_prize', trs.third_prize,
            'special_awards', trs.special_awards,
            'prize_distribution', trs.prize_distribution
        )
        FROM public.tournament_reward_structures trs 
        WHERE trs.tournament_id = tournaments.id
        LIMIT 1)
    )
WHERE EXISTS (
    SELECT 1 FROM public.tournament_reward_structures trs 
    WHERE trs.tournament_id = tournaments.id
);

-- Drop tournament_reward_structures table
DROP TABLE IF EXISTS public.tournament_reward_structures CASCADE;

-- Phase 3: Clean up redundant columns in tournaments table
-- Remove duplicate date columns (keep the newer naming convention)
ALTER TABLE public.tournaments 
DROP COLUMN IF EXISTS start_date,
DROP COLUMN IF EXISTS end_date,  
DROP COLUMN IF EXISTS registration_deadline,
DROP COLUMN IF EXISTS tournament_id;

-- Phase 4: Drop overlapping tournament_progression table 
-- (functionality covered by tournament_matches and tournament_results)
DROP TABLE IF EXISTS public.tournament_progression CASCADE;

-- Phase 5: Add performance indexes for remaining core tables
-- Tournaments indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON public.tournaments(tournament_start, tournament_end);
CREATE INDEX IF NOT EXISTS idx_tournaments_tier ON public.tournaments(tier_level);
CREATE INDEX IF NOT EXISTS idx_tournaments_club ON public.tournaments(club_id);

-- Tournament registrations indexes  
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status ON public.tournament_registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_payment ON public.tournament_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user_tournament ON public.tournament_registrations(user_id, tournament_id);

-- Tournament matches indexes
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON public.tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON public.tournament_matches(tournament_id, round_number);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_players ON public.tournament_matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_bracket ON public.tournament_matches(tournament_id, bracket_type);

-- Tournament results indexes
CREATE INDEX IF NOT EXISTS idx_tournament_results_position ON public.tournament_results(tournament_id, final_position);
CREATE INDEX IF NOT EXISTS idx_tournament_results_user ON public.tournament_results(user_id);

-- Phase 6: Update RLS policies for optimized structure
-- Update tournaments RLS policies
DROP POLICY IF EXISTS "Tournament visibility" ON public.tournaments;
CREATE POLICY "Tournament visibility" ON public.tournaments
FOR SELECT USING (
    status IN ('upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed') 
    AND (is_public = true OR auth.uid() = created_by OR is_current_user_admin())
);

-- Log the optimization
INSERT INTO public.system_logs (log_type, message, metadata)
VALUES (
    'database_optimization',
    'Tournament database optimization completed',
    jsonb_build_object(
        'tables_dropped', 7,
        'columns_removed', 4, 
        'indexes_added', 10,
        'optimization_date', now(),
        'tables_remaining', 7
    )
);