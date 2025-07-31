-- BATCH 5: MAINTENANCE AND CLEANUP INDEXES

-- Cleanup job efficiency
CREATE INDEX IF NOT EXISTS idx_error_logs_cleanup 
ON public.error_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_cleanup 
ON public.analytics_events (created_at);

CREATE INDEX IF NOT EXISTS idx_api_performance_cleanup 
ON public.api_performance_metrics (created_at);

-- Specialized queries  
CREATE INDEX IF NOT EXISTS idx_wallets_user_balance 
ON public.wallets (user_id, updated_at DESC) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_tournament_seeding 
ON public.tournament_seeding (tournament_id, seed_position);

-- Update statistics for query planner
ANALYZE public.notifications;
ANALYZE public.match_results; 
ANALYZE public.tournament_registrations;
ANALYZE public.challenges;
ANALYZE public.tournaments;
ANALYZE public.profiles;
ANALYZE public.player_rankings;