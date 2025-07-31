-- Fix Loser's Branch A Round 103 advancement - correct players should be Round 102 winners
UPDATE tournament_matches 
SET 
  player1_id = '630730f6-6a4c-4e91-aab3-ce9bdc92057b', -- Võ Lan Khoa (winner from Round 102 Match 1)
  player2_id = 'c227cca4-9687-4964-8d4a-051198545b29', -- Phạm Minh Long (winner from Round 102 Match 2)
  updated_at = NOW()
WHERE id = 'a6236e87-a31e-4d1e-9e52-5e4983a06900' -- Round 103 Match 1
AND tournament_id = (
  SELECT id FROM tournaments 
  WHERE status IN ('ongoing', 'registration_closed')
  ORDER BY created_at DESC LIMIT 1
);

-- Log the advancement fix
INSERT INTO tournament_automation_log (
  tournament_id,
  automation_type,
  status,
  details,
  completed_at
) VALUES (
  (SELECT id FROM tournaments WHERE status IN ('ongoing', 'registration_closed') ORDER BY created_at DESC LIMIT 1),
  'advancement_fix',
  'completed',
  jsonb_build_object(
    'action', 'fixed_round_103_players',
    'issue', 'wrong_player_advanced',
    'corrected_player1', 'Võ Lan Khoa',
    'corrected_player2', 'Phạm Minh Long',
    'removed_incorrect_player', 'Đặng Linh Hải'
  ),
  NOW()
);