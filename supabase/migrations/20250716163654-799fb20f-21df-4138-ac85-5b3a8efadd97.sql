-- Regenerate the double elimination bracket for the SABO OPEN tournament
SELECT public.generate_advanced_tournament_bracket(
  'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'::UUID,
  'elo_ranking',
  true -- Force regenerate
);