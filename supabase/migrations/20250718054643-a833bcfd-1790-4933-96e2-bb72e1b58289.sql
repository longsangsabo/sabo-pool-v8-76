-- Cập nhật status giải đấu thành completed và xử lý kết quả
UPDATE public.tournaments 
SET 
  status = 'completed',
  updated_at = now()
WHERE id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';

-- Gọi hàm xử lý kết quả giải đấu để cập nhật đầy đủ
SELECT public.process_tournament_completion('727a8ae8-0598-47bf-b305-2fc2bc60b57d');