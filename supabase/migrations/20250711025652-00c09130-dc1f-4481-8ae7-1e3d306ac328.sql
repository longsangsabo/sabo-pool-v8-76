-- BATCH 4: SEARCH AND RANKING INDEXES

-- Profile search (full-text)
CREATE INDEX IF NOT EXISTS idx_profiles_search_name 
ON public.profiles USING gin(to_tsvector('simple', COALESCE(full_name, '') || ' ' || COALESCE(display_name, ''))) 
WHERE deleted_at IS NULL;

-- Location-based filtering
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON public.profiles (city, district) 
WHERE deleted_at IS NULL AND is_visible = true;

-- ELO leaderboard
CREATE INDEX IF NOT EXISTS idx_player_rankings_elo 
ON public.player_rankings (elo DESC, updated_at DESC);