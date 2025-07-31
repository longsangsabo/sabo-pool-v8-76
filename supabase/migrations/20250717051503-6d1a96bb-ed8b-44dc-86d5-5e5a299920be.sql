-- Create missing bracket record for existing tournament
INSERT INTO tournament_brackets (
  tournament_id, 
  bracket_data, 
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
  now(),
  now()
) ON CONFLICT (tournament_id) DO UPDATE SET
  bracket_data = EXCLUDED.bracket_data,
  updated_at = now();

-- Also check for other tournaments missing bracket records
INSERT INTO tournament_brackets (
  tournament_id, 
  bracket_data, 
  created_at, 
  updated_at
)
SELECT 
  t.id,
  jsonb_build_object(
    'tournament_id', t.id,
    'tournament_type', t.tournament_type,
    'participants_count', COALESCE(match_stats.participant_count, 0),
    'rounds', COALESCE(match_stats.max_round, 0),
    'matches_count', COALESCE(match_stats.match_count, 0),
    'generated_at', now()
  ),
  now(),
  now()
FROM tournaments t
LEFT JOIN (
  SELECT 
    tournament_id,
    COUNT(DISTINCT COALESCE(player1_id, player2_id)) as participant_count,
    MAX(round_number) as max_round,
    COUNT(*) as match_count
  FROM tournament_matches 
  GROUP BY tournament_id
) match_stats ON t.id = match_stats.tournament_id
WHERE NOT EXISTS (
  SELECT 1 FROM tournament_brackets tb 
  WHERE tb.tournament_id = t.id
)
AND match_stats.match_count > 0
ON CONFLICT (tournament_id) DO NOTHING;