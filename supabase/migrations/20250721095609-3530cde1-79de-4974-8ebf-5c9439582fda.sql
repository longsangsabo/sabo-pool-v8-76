-- Add missing is_open_challenge column that was referenced in code but not created
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS is_open_challenge BOOLEAN DEFAULT false;