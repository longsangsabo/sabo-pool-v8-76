-- Fix unique constraint issue for double elimination
-- The constraint is preventing multiple brackets from having same round/match numbers
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_unique_round_match;

-- Add a new constraint that allows same round/match in different bracket types
ALTER TABLE tournament_matches ADD CONSTRAINT tournament_matches_unique_bracket_round_match 
UNIQUE (tournament_id, bracket_type, round_number, match_number);

-- Now regenerate the bracket
DELETE FROM tournament_matches WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07';
SELECT public.generate_advanced_tournament_bracket('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 'elo_ranking', true);