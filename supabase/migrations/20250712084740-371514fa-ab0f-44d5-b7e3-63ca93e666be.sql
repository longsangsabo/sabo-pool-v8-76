-- Continue Phase 1: Update remaining tables that still use player_id

-- Update rank_verifications table
ALTER TABLE public.rank_verifications
RENAME COLUMN player_id TO user_id;

-- Add foreign key constraint for rank_verifications
ALTER TABLE public.rank_verifications 
ADD CONSTRAINT fk_rank_verifications_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update player_stats table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_stats' AND column_name = 'player_id') THEN
        ALTER TABLE public.player_stats RENAME COLUMN player_id TO user_id;
        -- Add foreign key constraint
        ALTER TABLE public.player_stats 
        ADD CONSTRAINT fk_player_stats_user_id 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update tournament_registrations table  
ALTER TABLE public.tournament_registrations
RENAME COLUMN player_id TO user_id;

-- Add foreign key constraint for tournament_registrations
ALTER TABLE public.tournament_registrations 
ADD CONSTRAINT fk_tournament_registrations_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update match_ratings table
ALTER TABLE public.match_ratings
RENAME COLUMN rated_player_id TO rated_user_id;

-- Add foreign key constraint for match_ratings
ALTER TABLE public.match_ratings 
ADD CONSTRAINT fk_match_ratings_rated_user_id 
FOREIGN KEY (rated_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update notification_logs table (if it has player_id)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_logs' AND column_name = 'player_id') THEN
        ALTER TABLE public.notification_logs RENAME COLUMN player_id TO user_id;
    END IF;
END $$;