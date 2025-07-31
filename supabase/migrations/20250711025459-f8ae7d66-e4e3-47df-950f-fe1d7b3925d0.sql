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