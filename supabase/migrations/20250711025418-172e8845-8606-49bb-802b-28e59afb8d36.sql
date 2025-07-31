-- TASK 7: DATABASE INDEXES IMPLEMENTATION
-- Phase 1: Core Performance Indexes

-- ============================================
-- COMPOSITE INDEXES FOR USER_ID + CREATED_AT PATTERNS
-- ============================================

-- 1. Notifications (user_id, created_at) - High frequency queries
CREATE INDEX CONCURRENTLY idx_notifications_user_created 
ON public.notifications (user_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- 2. Match Results (player queries)
CREATE INDEX CONCURRENTLY idx_match_results_player1_date 
ON public.match_results (player1_id, match_date DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_match_results_player2_date 
ON public.match_results (player2_id, match_date DESC) 
WHERE deleted_at IS NULL;

-- 3. Tournament Registrations (user timeline)
CREATE INDEX CONCURRENTLY idx_tournament_registrations_user_date 
ON public.tournament_registrations (player_id, registration_date DESC);

-- 4. Challenges (user activity timeline)
CREATE INDEX CONCURRENTLY idx_challenges_challenger_created 
ON public.challenges (challenger_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_challenges_opponent_created 
ON public.challenges (opponent_id, created_at DESC) 
WHERE deleted_at IS NULL AND opponent_id IS NOT NULL;

-- ============================================
-- FOREIGN KEY INDEXES (Missing Critical Ones)
-- ============================================

-- 5. Tournament Matches
CREATE INDEX CONCURRENTLY idx_tournament_matches_tournament 
ON public.tournament_matches (tournament_id);

CREATE INDEX CONCURRENTLY idx_tournament_matches_player1 
ON public.tournament_matches (player1_id);

CREATE INDEX CONCURRENTLY idx_tournament_matches_player2 
ON public.tournament_matches (player2_id);

-- 6. Club Profiles
CREATE INDEX CONCURRENTLY idx_club_profiles_user 
ON public.club_profiles (user_id);

-- 7. Event Registrations
CREATE INDEX CONCURRENTLY idx_event_registrations_event 
ON public.event_registrations (event_id);

CREATE INDEX CONCURRENTLY idx_event_registrations_user 
ON public.event_registrations (user_id);

-- 8. Live Streams
CREATE INDEX CONCURRENTLY idx_live_streams_streamer 
ON public.live_streams (streamer_id);

CREATE INDEX CONCURRENTLY idx_live_streams_tournament 
ON public.live_streams (tournament_id) 
WHERE tournament_id IS NOT NULL;

-- ============================================
-- STATUS AND TYPE FIELD INDEXES
-- ============================================

-- 9. Tournament Status (for filtering active tournaments)
CREATE INDEX CONCURRENTLY idx_tournaments_status_start 
ON public.tournaments (status, tournament_start DESC) 
WHERE deleted_at IS NULL;

-- 10. Match Results Status (for pending confirmations)
CREATE INDEX CONCURRENTLY idx_match_results_status 
ON public.match_results (result_status, created_at DESC) 
WHERE deleted_at IS NULL;

-- 11. Challenges Status (for open challenges)
CREATE INDEX CONCURRENTLY idx_challenges_status_expires 
ON public.challenges (status, expires_at DESC) 
WHERE deleted_at IS NULL;

-- 12. Club Registration Status (for admin approval queue)
CREATE INDEX CONCURRENTLY idx_club_registrations_status 
ON public.club_registrations (status, created_at DESC);

-- ============================================
-- SEARCH AND FILTERING INDEXES
-- ============================================

-- 13. Profile Search (name search)
CREATE INDEX CONCURRENTLY idx_profiles_search_name 
ON public.profiles USING gin(to_tsvector('simple', full_name || ' ' || display_name)) 
WHERE deleted_at IS NULL;

-- 14. Location-based queries
CREATE INDEX CONCURRENTLY idx_profiles_location 
ON public.profiles (city, district) 
WHERE deleted_at IS NULL AND is_visible = true;

CREATE INDEX CONCURRENTLY idx_club_profiles_location 
ON public.club_profiles (verification_status) 
WHERE deleted_at IS NULL AND is_visible = true;

-- 15. ELO Rankings (leaderboard queries)
CREATE INDEX CONCURRENTLY idx_player_rankings_elo 
ON public.player_rankings (elo DESC, updated_at DESC);

-- ============================================
-- TEMPORAL INDEXES FOR CLEANUP JOBS
-- ============================================

-- 16. Cleanup and maintenance indexes
CREATE INDEX CONCURRENTLY idx_error_logs_cleanup 
ON public.error_logs (created_at) 
WHERE created_at < NOW() - INTERVAL '90 days';

CREATE INDEX CONCURRENTLY idx_analytics_events_cleanup 
ON public.analytics_events (created_at) 
WHERE created_at < NOW() - INTERVAL '60 days';

CREATE INDEX CONCURRENTLY idx_api_performance_cleanup 
ON public.api_performance_metrics (created_at) 
WHERE created_at < NOW() - INTERVAL '30 days';

-- ============================================
-- SPECIALIZED PERFORMANCE INDEXES
-- ============================================

-- 17. Wallet balance queries
CREATE INDEX CONCURRENTLY idx_wallets_user_balance 
ON public.wallets (user_id, updated_at DESC) 
WHERE status = 'active';

-- 18. Tournament bracket generation
CREATE INDEX CONCURRENTLY idx_tournament_seeding 
ON public.tournament_seeding (tournament_id, seed_position);

-- 19. Match automation
CREATE INDEX CONCURRENTLY idx_match_automation_status 
ON public.match_automation_log (status, created_at DESC);

-- 20. Notification preferences
CREATE INDEX CONCURRENTLY idx_notification_preferences_user 
ON public.notification_preferences (user_id);

-- ============================================
-- ANALYZE TABLES AFTER INDEX CREATION
-- ============================================

-- Update table statistics for query planner
ANALYZE public.notifications;
ANALYZE public.match_results;
ANALYZE public.tournament_registrations;
ANALYZE public.challenges;
ANALYZE public.tournaments;
ANALYZE public.profiles;
ANALYZE public.player_rankings;
ANALYZE public.tournament_matches;
ANALYZE public.club_profiles;