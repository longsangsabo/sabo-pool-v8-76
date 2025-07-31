-- Fix the tournament status to ongoing for "Sáng tạo nội dung" tournament
UPDATE public.tournaments 
SET 
  status = 'ongoing',
  updated_at = NOW()
WHERE id = '051a75a8-a0c5-48bb-b28b-a5465f4d0058' AND name = 'Sáng tạo nội dung';