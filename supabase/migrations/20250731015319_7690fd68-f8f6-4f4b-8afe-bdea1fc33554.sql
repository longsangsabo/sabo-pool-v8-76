-- Add is_draft field to tournaments table if it doesn't exist
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false;

-- Create index for efficient draft tournament queries
CREATE INDEX IF NOT EXISTS idx_tournaments_is_draft 
ON public.tournaments(is_draft) 
WHERE is_draft = true;