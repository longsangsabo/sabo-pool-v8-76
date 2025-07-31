-- Create third place match for test2 tournament
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
  '2b252d70-5cf3-427f-92b7-48eea40753d8', -- test2 tournament ID
  3, -- Same round as semifinals (round 3)
  99, -- Special match number to avoid conflicts
  'third_place',
  'da7b73f9-833b-4dd7-b887-c09e1cffca6f', -- Loser of semifinal match 1
  'c1ee98ea-db15-4a29-9947-09cd5ad6a600', -- Loser of semifinal match 2
  true, -- Mark as third place match
  'scheduled',
  now(),
  now()
);