-- COMPREHENSIVE player_id -> user_id MIGRATION
-- Fix all remaining tables with player_id columns

-- 1. player_trust_scores table
ALTER TABLE public.player_trust_scores 
ADD COLUMN user_id UUID REFERENCES public.profiles(user_id);

-- Copy data from player_id to user_id  
UPDATE public.player_trust_scores 
SET user_id = player_id;

-- Drop old column and constraints
ALTER TABLE public.player_trust_scores 
DROP COLUMN player_id;

-- Add NOT NULL constraint
ALTER TABLE public.player_trust_scores 
ALTER COLUMN user_id SET NOT NULL;

-- Create unique constraint
ALTER TABLE public.player_trust_scores 
ADD CONSTRAINT player_trust_scores_user_id_unique UNIQUE (user_id);

-- 2. spa_calculation_logs table
ALTER TABLE public.spa_calculation_logs 
ADD COLUMN user_id UUID REFERENCES public.profiles(user_id);

UPDATE public.spa_calculation_logs 
SET user_id = player_id;

ALTER TABLE public.spa_calculation_logs 
DROP COLUMN player_id;

ALTER TABLE public.spa_calculation_logs 
ALTER COLUMN user_id SET NOT NULL;

-- 3. player_milestones table
ALTER TABLE public.player_milestones 
ADD COLUMN user_id UUID REFERENCES public.profiles(user_id);

UPDATE public.player_milestones 
SET user_id = player_id;

ALTER TABLE public.player_milestones 
DROP COLUMN player_id;

ALTER TABLE public.player_milestones 
ALTER COLUMN user_id SET NOT NULL;

-- 4. tournament_results table
ALTER TABLE public.tournament_results 
ADD COLUMN user_id UUID REFERENCES public.profiles(user_id);

UPDATE public.tournament_results 
SET user_id = player_id;

ALTER TABLE public.tournament_results 
DROP COLUMN player_id;

ALTER TABLE public.tournament_results 
ALTER COLUMN user_id SET NOT NULL;

-- 5. player_cues table
ALTER TABLE public.player_cues 
ADD COLUMN user_id UUID REFERENCES public.profiles(user_id);

UPDATE public.player_cues 
SET user_id = player_id;

ALTER TABLE public.player_cues 
DROP COLUMN player_id;

ALTER TABLE public.player_cues 
ALTER COLUMN user_id SET NOT NULL;

-- 6. player_achievements table
ALTER TABLE public.player_achievements 
ADD COLUMN user_id UUID REFERENCES public.profiles(user_id);

UPDATE public.player_achievements 
SET user_id = player_id;

ALTER TABLE public.player_achievements 
DROP COLUMN player_id;

ALTER TABLE public.player_achievements 
ALTER COLUMN user_id SET NOT NULL;

-- 7. rank_adjustments table
ALTER TABLE public.rank_adjustments 
ADD COLUMN user_id UUID REFERENCES public.profiles(user_id);

UPDATE public.rank_adjustments 
SET user_id = player_id;

ALTER TABLE public.rank_adjustments 
DROP COLUMN player_id;

ALTER TABLE public.rank_adjustments 
ALTER COLUMN user_id SET NOT NULL;

-- 8. tournament_seeding table
ALTER TABLE public.tournament_seeding 
ADD COLUMN user_id UUID REFERENCES public.profiles(user_id);

UPDATE public.tournament_seeding 
SET user_id = player_id;

ALTER TABLE public.tournament_seeding 
DROP COLUMN player_id;

ALTER TABLE public.tournament_seeding 
ALTER COLUMN user_id SET NOT NULL;

-- 9. player_elo_decay table
ALTER TABLE public.player_elo_decay 
ADD COLUMN user_id UUID REFERENCES public.profiles(user_id);

UPDATE public.player_elo_decay 
SET user_id = player_id;

ALTER TABLE public.player_elo_decay 
DROP COLUMN player_id;

ALTER TABLE public.player_elo_decay 
ALTER COLUMN user_id SET NOT NULL;

-- 10. tournament_qualifications table
ALTER TABLE public.tournament_qualifications 
ADD COLUMN user_id UUID REFERENCES public.profiles(user_id);

UPDATE public.tournament_qualifications 
SET user_id = player_id;

ALTER TABLE public.tournament_qualifications 
DROP COLUMN player_id;

ALTER TABLE public.tournament_qualifications 
ALTER COLUMN user_id SET NOT NULL;

-- 11. season_summaries table
ALTER TABLE public.season_summaries 
ADD COLUMN user_id UUID REFERENCES public.profiles(user_id);

UPDATE public.season_summaries 
SET user_id = player_id;

ALTER TABLE public.season_summaries 
DROP COLUMN player_id;

ALTER TABLE public.season_summaries 
ALTER COLUMN user_id SET NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_trust_scores_user_id ON public.player_trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_spa_calculation_logs_user_id ON public.spa_calculation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_player_milestones_user_id ON public.player_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_user_id ON public.tournament_results(user_id);
CREATE INDEX IF NOT EXISTS idx_player_cues_user_id ON public.player_cues(user_id);
CREATE INDEX IF NOT EXISTS idx_player_achievements_user_id ON public.player_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_adjustments_user_id ON public.rank_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_seeding_user_id ON public.tournament_seeding(user_id);
CREATE INDEX IF NOT EXISTS idx_player_elo_decay_user_id ON public.player_elo_decay(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_qualifications_user_id ON public.tournament_qualifications(user_id);
CREATE INDEX IF NOT EXISTS idx_season_summaries_user_id ON public.season_summaries(user_id);