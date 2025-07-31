-- Fix double4 tournament structure
-- The issue is: Round 250 has 2 completed semifinal matches but no final consolidation
-- We need a Loser's Bracket Final to consolidate the 2 winners into 1 winner
-- Then Championship Final = Winner's Bracket Final winner vs Loser's Bracket Final winner

-- Create a Loser's Bracket Final match (Round 251) to consolidate the 2 semifinal winners
INSERT INTO tournament_matches (
  tournament_id, round_number, match_number,
  player1_id, player2_id, status, bracket_type, match_stage,
  created_at, updated_at
) VALUES (
  '16cc9b3e-6c4d-4ec3-b721-668a42f8497d', 251, 1,
  'd7d6ce12-490f-4fff-b913-80044de5e169',  -- Round 250 Match 1 winner
  '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2',  -- Round 250 Match 2 winner
  'scheduled', 'losers', 'final',
  NOW(), NOW()
) ON CONFLICT (tournament_id, round_number, match_number) DO NOTHING;