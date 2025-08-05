-- ============================================
-- TASK 7: DATABASE INDEXES IMPLEMENTATION
-- MIGRATION PLAN - EXECUTE IN SEPARATE BATCHES
-- ============================================

-- BATCH 1: CRITICAL USER ACTIVITY INDEXES
-- Execute these first for immediate performance gains

-- 1. Notifications user timeline
CREATE INDEX idx_notifications_user_created 
ON public.notifications (user_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- 2. Match Results for players
CREATE INDEX idx_match_results_player1_date 
ON public.match_results (player1_id, match_date DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_match_results_player2_date 
ON public.match_results (player2_id, match_date DESC) 
WHERE deleted_at IS NULL;

-- 3. Tournament registrations timeline
CREATE INDEX idx_tournament_registrations_user_date 
ON public.tournament_registrations (player_id, registration_date DESC);

-- 4. User challenge activity
CREATE INDEX idx_challenges_challenger_created 
ON public.challenges (challenger_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_challenges_opponent_created 
ON public.challenges (opponent_id, created_at DESC) 
WHERE deleted_at IS NULL AND opponent_id IS NOT NULL;

-- BATCH 2: FOREIGN KEY INDEXES
-- Execute after Batch 1 completes

-- Tournament match relationships
CREATE INDEX idx_tournament_matches_tournament 
ON public.tournament_matches (tournament_id);

CREATE INDEX idx_tournament_matches_player1 
ON public.tournament_matches (player1_id);

CREATE INDEX idx_tournament_matches_player2 
ON public.tournament_matches (player2_id);

-- Club and event relationships
CREATE INDEX idx_club_profiles_user 
ON public.club_profiles (user_id);

CREATE INDEX idx_event_registrations_event 
ON public.event_registrations (event_id);

CREATE INDEX idx_event_registrations_user 
ON public.event_registrations (user_id);

-- BATCH 3: STATUS AND FILTERING INDEXES
-- Execute after Batch 2 completes

-- Tournament filtering
CREATE INDEX idx_tournaments_status_start 
ON public.tournaments (status, tournament_start DESC) 
WHERE deleted_at IS NULL;

-- Match result status
CREATE INDEX idx_match_results_status 
ON public.match_results (result_status, created_at DESC) 
WHERE deleted_at IS NULL;

-- Challenge status
CREATE INDEX idx_challenges_status_expires 
ON public.challenges (status, expires_at DESC) 
WHERE deleted_at IS NULL;

-- Club registration admin queue
CREATE INDEX idx_club_registrations_status 
ON public.club_registrations (status, created_at DESC);

-- BATCH 4: SEARCH AND RANKING INDEXES
-- Execute after Batch 3 completes

-- Profile search (full-text)
CREATE INDEX idx_profiles_search_name 
ON public.profiles USING gin(to_tsvector('simple', full_name || ' ' || display_name)) 
WHERE deleted_at IS NULL;

-- Location-based filtering
CREATE INDEX idx_profiles_location 
ON public.profiles (city, district) 
WHERE deleted_at IS NULL AND is_visible = true;

-- ELO leaderboard
CREATE INDEX idx_player_rankings_elo 
ON public.player_rankings (elo DESC, updated_at DESC);

-- BATCH 5: MAINTENANCE AND CLEANUP INDEXES
-- Execute last, lowest priority

-- Cleanup job efficiency
CREATE INDEX idx_error_logs_cleanup 
ON public.error_logs (created_at);

CREATE INDEX idx_analytics_events_cleanup 
ON public.analytics_events (created_at);

CREATE INDEX idx_api_performance_cleanup 
ON public.api_performance_metrics (created_at);

-- Specialized queries
CREATE INDEX idx_wallets_user_balance 
ON public.wallets (user_id, updated_at DESC) 
WHERE status = 'active';

CREATE INDEX idx_tournament_seeding 
ON public.tournament_seeding (tournament_id, seed_position);

-- ============================================
-- POST-INDEX ANALYSIS COMMANDS
-- Run after all indexes are created
-- ============================================

ANALYZE public.notifications;
ANALYZE public.match_results; 
ANALYZE public.tournament_registrations;
ANALYZE public.challenges;
ANALYZE public.tournaments;
ANALYZE public.profiles;
ANALYZE public.player_rankings;
ANALYZE public.tournament_matches;
ANALYZE public.club_profiles;