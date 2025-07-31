-- Clear all existing matches and regenerate double elimination bracket
DELETE FROM tournament_matches WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07';

-- Regenerate the bracket with force
SELECT public.generate_advanced_tournament_bracket('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 'elo_ranking', true);