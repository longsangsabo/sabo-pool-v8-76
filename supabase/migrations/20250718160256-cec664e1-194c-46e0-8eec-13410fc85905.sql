-- Create third place match for test3 tournament
INSERT INTO tournament_matches (
  tournament_id,
  round_number,
  match_number,
  bracket_type,
  player1_id,
  player2_id,
  is_third_place_match,
  status,
  created_at,
  updated_at
) VALUES (
  '917c205b-ac34-4dc1-b84a-6477a562913b', -- test3 tournament ID
  3, -- Same round as semifinals (round 3)
  99, -- Special match number to avoid conflicts
  'third_place',
  '7551b33a-8163-4f0e-9785-046c530877fa', -- Loser of semifinal match 1
  '5ad7e05f-56bd-4ea4-baa8-32286d4bfc4a', -- Loser of semifinal match 2
  true, -- Mark as third place match
  'scheduled',
  now(),
  now()
);