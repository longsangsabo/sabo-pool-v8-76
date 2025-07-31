-- Cập nhật Championship Final với 2 winners đã xác định
-- Winners Bracket Final: d7d6ce12-490f-4fff-b913-80044de5e169 (Anh Long)
-- Losers Bracket Final: 3b4b5cf4-ce15-4036-9308-b21b076525b7

UPDATE tournament_matches 
SET 
  player1_id = 'd7d6ce12-490f-4fff-b913-80044de5e169',  -- Winners Bracket Final winner
  player2_id = '3b4b5cf4-ce15-4036-9308-b21b076525b7',  -- Losers Bracket Final winner
  status = 'scheduled',
  updated_at = NOW()
WHERE tournament_id = '16cc9b3e-6c4d-4ec3-b721-668a42f8497d'
  AND round_number = 300 
  AND match_number = 1;

-- Xác nhận cập nhật thành công
SELECT 
  tm.round_number,
  tm.match_number,
  tm.status,
  p1.full_name as player1_name,
  p2.full_name as player2_name,
  'Championship Final Updated Successfully' as result
FROM tournament_matches tm
LEFT JOIN profiles p1 ON tm.player1_id = p1.user_id
LEFT JOIN profiles p2 ON tm.player2_id = p2.user_id
WHERE tm.tournament_id = '16cc9b3e-6c4d-4ec3-b721-668a42f8497d'
  AND tm.round_number = 300 
  AND tm.match_number = 1;