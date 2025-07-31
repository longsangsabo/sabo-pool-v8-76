-- Cập nhật trận tranh hạng 3 với 2 người thua ở bán kết
UPDATE public.tournament_matches 
SET 
  player1_id = '570f94dd-91f1-4f43-9ad3-6f152db91f67', -- Club Owner 1752123983738 (thua trận bán kết 1)
  player2_id = 'c1ee98ea-db15-4a29-9947-09cd5ad6a600', -- Club Owner 1752123983536 (thua trận bán kết 2)
  status = 'scheduled',
  updated_at = now()
WHERE tournament_id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d' 
AND is_third_place_match = true;