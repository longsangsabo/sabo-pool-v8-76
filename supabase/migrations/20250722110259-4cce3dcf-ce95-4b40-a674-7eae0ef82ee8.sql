
-- Add 'upcoming' to the tournaments status check constraint
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_status_check 
CHECK (status = ANY (ARRAY[
  'upcoming'::text,
  'registration_open'::text, 
  'registration_closed'::text, 
  'ongoing'::text, 
  'completed'::text, 
  'cancelled'::text
]));

-- Update the auto tournament status function to handle the upcoming -> registration_open transition
CREATE OR REPLACE FUNCTION public.auto_update_single_tournament_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update tournaments from upcoming to registration_open when registration starts
  UPDATE public.tournaments 
  SET status = 'registration_open', updated_at = NOW()
  WHERE status = 'upcoming' 
    AND registration_start <= NOW()
    AND (registration_end IS NULL OR registration_end > NOW());

  -- Update tournaments from registration_open to registration_closed when registration ends
  UPDATE public.tournaments 
  SET status = 'registration_closed', updated_at = NOW()
  WHERE status = 'registration_open' 
    AND registration_end <= NOW()
    AND (tournament_start IS NULL OR tournament_start > NOW());

  -- Update tournaments from registration_closed to ongoing when tournament starts  
  UPDATE public.tournaments 
  SET status = 'ongoing', updated_at = NOW()
  WHERE status IN ('registration_closed', 'registration_open')
    AND tournament_start <= NOW()
    AND (tournament_end IS NULL OR tournament_end > NOW());

  -- Update tournaments from ongoing to completed when tournament ends
  UPDATE public.tournaments 
  SET status = 'completed', updated_at = NOW()
  WHERE status = 'ongoing' 
    AND tournament_end <= NOW();
END;
$$;

-- Add a comment explaining the status flow
COMMENT ON CONSTRAINT tournaments_status_check ON public.tournaments IS 
'Tournament status flow: upcoming -> registration_open -> registration_closed -> ongoing -> completed (or cancelled at any point)';
