-- Allow null opponent_id for open challenges
ALTER TABLE public.challenges ALTER COLUMN opponent_id DROP NOT NULL;

-- Add a new field to indicate if it's an open challenge
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS is_open_challenge BOOLEAN DEFAULT FALSE;

-- Update existing challenges to mark them as not open
UPDATE public.challenges SET is_open_challenge = FALSE WHERE is_open_challenge IS NULL;