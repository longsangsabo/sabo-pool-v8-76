-- Xóa dữ liệu cũ và trigger lại tính toán với logic đã sửa
DELETE FROM public.tournament_results 
WHERE tournament_id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';

-- Reset tournament status để trigger lại function
UPDATE public.tournaments 
SET status = 'active',
    updated_at = NOW()
WHERE id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';

-- Trigger lại function bằng cách set status = completed
UPDATE public.tournaments 
SET status = 'completed',
    updated_at = NOW()
WHERE id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';