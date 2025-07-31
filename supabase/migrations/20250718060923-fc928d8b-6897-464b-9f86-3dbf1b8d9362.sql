-- Fix the tournament status issue
UPDATE public.tournaments 
SET status = 'completed'
WHERE id = '727a8ae8-0598-47bf-b305-2fc2bc60b57d';