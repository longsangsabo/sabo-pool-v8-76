-- Create missing bracket record for existing tournament with required fields
INSERT INTO tournament_brackets (
  tournament_id, 
  bracket_data,
  total_rounds,
  total_players,
  bracket_type,
  status,
  created_at, 
  updated_at
) VALUES (
  'd8f6f334-7fa0-4dc3-9804-1d25379d9d07',
  jsonb_build_object(
    'tournament_id', 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07',
    'tournament_type', 'double_elimination',
    'participants_count', (
      SELECT COUNT(DISTINCT COALESCE(player1_id, player2_id))
      FROM tournament_matches 
      WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
    ),
    'rounds', (
      SELECT MAX(round_number) 
      FROM tournament_matches 
      WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
    ),
    'matches_count', (
      SELECT COUNT(*) 
      FROM tournament_matches 
      WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
    ),
    'generated_at', now()
  ),
  (SELECT MAX(round_number) FROM tournament_matches WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'),
  (SELECT COUNT(DISTINCT COALESCE(player1_id, player2_id)) FROM tournament_matches WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'),
  'double_elimination',
  'active',
  now(),
  now()
) ON CONFLICT (tournament_id) DO UPDATE SET
  bracket_data = EXCLUDED.bracket_data,
  total_rounds = EXCLUDED.total_rounds,
  total_players = EXCLUDED.total_players,
  updated_at = now();