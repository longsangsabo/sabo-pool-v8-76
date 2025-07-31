-- Update tournament status to completed to trigger results processing
UPDATE public.tournaments 
SET status = 'completed',
    updated_at = NOW()
WHERE id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';