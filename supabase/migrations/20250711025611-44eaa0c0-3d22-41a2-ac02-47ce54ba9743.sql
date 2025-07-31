-- BATCH 3 (REVISED): CREATE ONLY MISSING STATUS INDEXES

-- Check existing indexes first, then create only missing ones

-- Match result status (check if exists first)
CREATE INDEX IF NOT EXISTS idx_match_results_status 
ON public.match_results (result_status, created_at DESC) 
WHERE deleted_at IS NULL;

-- Challenge status (check if exists first)
CREATE INDEX IF NOT EXISTS idx_challenges_status_expires 
ON public.challenges (status, expires_at DESC) 
WHERE deleted_at IS NULL;

-- Club registration admin queue (check if exists first)
CREATE INDEX IF NOT EXISTS idx_club_registrations_status 
ON public.club_registrations (status, created_at DESC);