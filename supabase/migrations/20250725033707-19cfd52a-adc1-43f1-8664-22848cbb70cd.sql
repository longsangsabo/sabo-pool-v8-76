-- Cập nhật trận Championship Final với 2 winners từ Semifinal
UPDATE tournament_matches 
SET player1_id = 'd7d6ce12-490f-4fff-b913-80044de5e169', -- Anh Long (Semifinal Winner 1)
    player2_id = '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2', -- Phan Thị Bình (Semifinal Winner 2)
    updated_at = NOW()
WHERE tournament_id = (SELECT id FROM tournaments WHERE name ILIKE '%new1%' LIMIT 1)
  AND bracket_type = 'final'
  AND match_number = 1;