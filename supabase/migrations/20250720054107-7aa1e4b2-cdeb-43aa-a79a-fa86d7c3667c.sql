-- Force update the tournament status directly without any triggers interfering
UPDATE public.tournaments 
SET 
  status = 'ongoing',
  updated_at = NOW()
WHERE id = '051a75a8-a0c5-48bb-b28b-a5465f4d0058';