-- Enable realtime for tournament tables
ALTER TABLE public.tournaments REPLICA IDENTITY FULL;
ALTER TABLE public.tournament_registrations REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_registrations;

-- Function to update tournament participant count automatically
CREATE OR REPLACE FUNCTION public.update_tournament_participant_count()
RETURNS TRIGGER AS $$
DECLARE
  tournament_uuid UUID;
  participant_count INTEGER;
  start_time TIMESTAMP;
BEGIN
  start_time := clock_timestamp();
  tournament_uuid := COALESCE(NEW.tournament_id, OLD.tournament_id);
  
  -- Calculate confirmed participants count
  SELECT COUNT(*) INTO participant_count
  FROM public.tournament_registrations 
  WHERE tournament_id = tournament_uuid
  AND registration_status = 'confirmed';
  
  -- Update tournament current_participants
  UPDATE public.tournaments 
  SET 
    current_participants = participant_count,
    updated_at = NOW()
  WHERE id = tournament_uuid;
  
  -- Log the automation performance
  INSERT INTO public.automation_performance_log (
    automation_type,
    success,
    execution_time_ms,
    tournament_id,
    metadata
  ) VALUES (
    'participant_count_update',
    true,
    extract(epoch from clock_timestamp() - start_time) * 1000,
    tournament_uuid,
    jsonb_build_object(
      'event_type', TG_OP,
      'participant_count', participant_count,
      'registration_id', COALESCE(NEW.id, OLD.id)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    -- Log failed automation
    INSERT INTO public.automation_performance_log (
      automation_type,
      success,
      execution_time_ms,
      tournament_id,
      error_message,
      metadata
    ) VALUES (
      'participant_count_update',
      false,
      extract(epoch from clock_timestamp() - start_time) * 1000,
      tournament_uuid,
      SQLERRM,
      jsonb_build_object(
        'event_type', TG_OP,
        'error_detail', SQLSTATE
      )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tournament registration automation
DROP TRIGGER IF EXISTS tournament_registration_automation ON public.tournament_registrations;
CREATE TRIGGER tournament_registration_automation
  AFTER INSERT OR UPDATE OR DELETE ON public.tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_tournament_participant_count();

-- Function to update tournament status automatically based on time
CREATE OR REPLACE FUNCTION public.auto_update_tournament_status()
RETURNS void AS $$
BEGIN
  -- Update tournament statuses based on current time
  UPDATE public.tournaments 
  SET 
    status = CASE
      WHEN now() < registration_start THEN 'upcoming'
      WHEN now() >= registration_start AND now() <= COALESCE(registration_end, registration_deadline) THEN 'registration_open'
      WHEN now() > COALESCE(registration_end, registration_deadline) AND now() < tournament_start THEN 'registration_closed'
      WHEN now() >= tournament_start AND now() <= tournament_end THEN 'ongoing'
      WHEN now() > tournament_end THEN 'completed'
      ELSE status
    END,
    updated_at = now()
  WHERE status NOT IN ('cancelled', 'completed')
  AND (
    (now() >= registration_start AND status = 'upcoming') OR
    (now() > COALESCE(registration_end, registration_deadline) AND status = 'registration_open') OR
    (now() >= tournament_start AND status = 'registration_closed') OR
    (now() > tournament_end AND status = 'ongoing')
  );
  
  -- Log automation performance
  INSERT INTO public.automation_performance_log (
    automation_type,
    success,
    execution_time_ms,
    metadata
  ) VALUES (
    'tournament_status_update',
    true,
    0,
    jsonb_build_object('updated_at', now())
  );
END;
$$ LANGUAGE plpgsql;

-- Create index for better performance on tournament queries
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_status 
ON public.tournament_registrations(tournament_id, registration_status);

CREATE INDEX IF NOT EXISTS idx_tournaments_status_dates 
ON public.tournaments(status, registration_start, registration_end, tournament_start);

-- Notify function for real-time updates
CREATE OR REPLACE FUNCTION public.notify_tournament_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify about tournament changes for real-time updates
  PERFORM pg_notify(
    'tournament_update',
    json_build_object(
      'table', TG_TABLE_NAME,
      'type', TG_OP,
      'tournament_id', COALESCE(NEW.tournament_id, OLD.tournament_id, NEW.id, OLD.id),
      'data', COALESCE(row_to_json(NEW), row_to_json(OLD))
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add notify trigger to tournaments table
DROP TRIGGER IF EXISTS tournament_notify_trigger ON public.tournaments;
CREATE TRIGGER tournament_notify_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.notify_tournament_change();

-- Add notify trigger to tournament_registrations table  
DROP TRIGGER IF EXISTS tournament_registration_notify_trigger ON public.tournament_registrations;
CREATE TRIGGER tournament_registration_notify_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_tournament_change();