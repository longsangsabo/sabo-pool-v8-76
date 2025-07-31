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