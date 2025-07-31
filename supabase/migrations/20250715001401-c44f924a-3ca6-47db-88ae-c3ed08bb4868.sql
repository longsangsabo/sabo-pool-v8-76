-- Fix tournament creation fields and auto-status update logic
-- The issue is field name mismatch and incorrect time logic

-- First, fix the auto_update_tournament_status function to handle both field names
CREATE OR REPLACE FUNCTION public.auto_update_tournament_status()
RETURNS void AS $$
BEGIN
  -- Update tournament statuses based on current time
  -- Handle both old and new field names for compatibility
  UPDATE public.tournaments 
  SET 
    status = CASE
      WHEN now() < COALESCE(registration_start, start_date) THEN 'upcoming'
      WHEN now() >= COALESCE(registration_start, start_date) AND 
           now() <= COALESCE(registration_end, registration_deadline, COALESCE(tournament_start, end_date)) THEN 'registration_open'
      WHEN now() > COALESCE(registration_end, registration_deadline, COALESCE(tournament_start, end_date)) AND 
           now() < COALESCE(tournament_start, end_date) THEN 'registration_closed'
      WHEN now() >= COALESCE(tournament_start, end_date) AND 
           now() <= COALESCE(tournament_end, end_date + INTERVAL '1 day') THEN 'ongoing'
      WHEN now() > COALESCE(tournament_end, end_date + INTERVAL '1 day') THEN 'completed'
      ELSE status
    END,
    updated_at = now()
  WHERE status NOT IN ('cancelled', 'completed');
  
  RAISE NOTICE 'Tournament status auto-update completed for % tournaments', 
    (SELECT COUNT(*) FROM public.tournaments WHERE status NOT IN ('cancelled', 'completed'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update tournament status when tournament is created/updated
CREATE OR REPLACE FUNCTION public.auto_update_single_tournament_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update status for this specific tournament
  NEW.status = CASE
    WHEN now() < COALESCE(NEW.registration_start, NEW.start_date) THEN 'upcoming'
    WHEN now() >= COALESCE(NEW.registration_start, NEW.start_date) AND 
         now() <= COALESCE(NEW.registration_end, NEW.registration_deadline, NEW.tournament_start, NEW.end_date) THEN 'registration_open'
    WHEN now() > COALESCE(NEW.registration_end, NEW.registration_deadline, NEW.tournament_start, NEW.end_date) AND 
         now() < COALESCE(NEW.tournament_start, NEW.end_date) THEN 'registration_closed'
    WHEN now() >= COALESCE(NEW.tournament_start, NEW.end_date) AND 
         now() <= COALESCE(NEW.tournament_end, NEW.end_date + INTERVAL '1 day') THEN 'ongoing'
    WHEN now() > COALESCE(NEW.tournament_end, NEW.end_date + INTERVAL '1 day') THEN 'completed'
    ELSE COALESCE(NEW.status, 'upcoming')
  END;
  
  -- Ensure tournament_id is synced with id
  NEW.tournament_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-status update on insert/update
DROP TRIGGER IF EXISTS auto_tournament_status_trigger ON public.tournaments;
CREATE TRIGGER auto_tournament_status_trigger
  BEFORE INSERT OR UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_single_tournament_status();

-- Fix any existing tournaments with wrong dates (Unix epoch time 1970)
UPDATE public.tournaments 
SET 
  tournament_start = CASE 
    WHEN tournament_start < '1980-01-01'::timestamp THEN now() + INTERVAL '1 day'
    ELSE tournament_start 
  END,
  tournament_end = CASE 
    WHEN tournament_end < '1980-01-01'::timestamp THEN now() + INTERVAL '2 days'
    ELSE tournament_end 
  END,
  registration_start = CASE 
    WHEN registration_start < '1980-01-01'::timestamp THEN now()
    ELSE registration_start 
  END,
  registration_end = CASE 
    WHEN registration_end < '1980-01-01'::timestamp OR registration_end IS NULL THEN now() + INTERVAL '12 hours'
    ELSE registration_end 
  END,
  status = 'registration_open',
  updated_at = now()
WHERE tournament_start < '1980-01-01'::timestamp OR 
      tournament_end < '1980-01-01'::timestamp OR
      registration_start < '1980-01-01'::timestamp;

-- Run auto-update to ensure all tournaments have correct status
SELECT public.auto_update_tournament_status();