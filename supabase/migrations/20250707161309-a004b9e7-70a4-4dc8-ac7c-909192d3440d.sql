-- Create function to update tournament participant count
CREATE OR REPLACE FUNCTION public.update_tournament_participants(
  tournament_id UUID,
  increment INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.tournaments 
  SET current_participants = GREATEST(0, current_participants + increment),
      updated_at = now()
  WHERE id = tournament_id;
  
  -- Also update realtime stats if they exist
  UPDATE public.tournament_realtime_stats
  SET current_participants = GREATEST(0, current_participants + increment),
      updated_at = now()
  WHERE tournament_id = tournament_id;
END;
$$;