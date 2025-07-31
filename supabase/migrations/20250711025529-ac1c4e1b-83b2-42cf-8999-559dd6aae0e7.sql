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