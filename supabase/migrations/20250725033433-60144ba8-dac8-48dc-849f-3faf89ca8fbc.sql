-- Thêm 4 winners vào Semifinal Round cho tournament new1
-- 2 từ Winner's Bracket, 1 từ Loser's Branch A, 1 từ Loser's Branch B

INSERT INTO tournament_matches (
  tournament_id,
  round_number,
  match_number,
  player1_id,
  player2_id,
  bracket_type,
  status,
  created_at,
  updated_at
) VALUES 
-- Semifinal Match 1: Winner từ Winner's Bracket vs Winner từ Loser's Branch A
(
  (SELECT id FROM tournaments WHERE name ILIKE '%new1%' LIMIT 1),
  1, -- Round 1 của Semifinal
  1, -- Match 1
  'd7d6ce12-490f-4fff-b913-80044de5e169', -- Anh Long (Winner's Bracket)
  'f271ced4-12e2-4643-8123-1a65df65acf8', -- Vũ Nam Khoa (Loser's Branch A)
  'semifinal',
  'scheduled',
  NOW(),
  NOW()
),
-- Semifinal Match 2: Winner từ Winner's Bracket vs Winner từ Loser's Branch B  
(
  (SELECT id FROM tournaments WHERE name ILIKE '%new1%' LIMIT 1),
  1, -- Round 1 của Semifinal
  2, -- Match 2
  '1b20b730-51f7-4a58-9d14-ca168a51be99', -- Võ Hương Cường (Winner's Bracket)
  '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2', -- Phan Thị Bình (Loser's Branch B)
  'semifinal',
  'scheduled',
  NOW(),
  NOW()
);