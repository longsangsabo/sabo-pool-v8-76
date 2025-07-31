-- Fix constraint issue for double elimination bracket generation
-- Remove the constraint that requires at least one player
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_at_least_one_player_check;

-- Regenerate the double elimination bracket properly
SELECT public.generate_advanced_tournament_bracket('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 'elo_ranking', true);