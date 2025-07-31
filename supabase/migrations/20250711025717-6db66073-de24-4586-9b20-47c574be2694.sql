-- BATCH 4 (CORRECTED): SEARCH AND RANKING INDEXES

-- Profile search (full-text) - only if both columns exist
CREATE INDEX IF NOT EXISTS idx_profiles_search_name 
ON public.profiles USING gin(to_tsvector('simple', COALESCE(full_name, '') || ' ' || COALESCE(display_name, ''))) 
WHERE deleted_at IS NULL;

-- Location-based filtering
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON public.profiles (city, district) 
WHERE deleted_at IS NULL AND is_visible = true;

-- ELO leaderboard (using correct column name)
CREATE INDEX IF NOT EXISTS idx_player_rankings_elo_points 
ON public.player_rankings (elo_points DESC, updated_at DESC)
WHERE deleted_at IS NULL;