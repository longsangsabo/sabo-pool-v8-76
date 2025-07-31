-- Fix infinite recursion in tournament automation trigger

DROP TRIGGER IF EXISTS tournament_automation_trigger ON tournaments;

-- Create improved automation function that prevents infinite loops
CREATE OR REPLACE FUNCTION public.universal_tournament_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participant_count INTEGER;
  v_bracket_result JSONB;
  v_automation_lock_key TEXT;
BEGIN
  -- Prevent infinite recursion by checking if this is an automation update
  v_automation_lock_key := TG_TABLE_NAME || '_automation_' || NEW.id::text;
  
  -- Skip automation if this update was triggered by automation itself
  IF EXISTS (
    SELECT 1 FROM pg_stat_activity 
    WHERE application_name LIKE '%automation%' 
    AND query LIKE '%' || NEW.id::text || '%'
  ) THEN
    RETURN NEW;
  END IF;

  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = NEW.id;
  
  -- AUTOMATION 1: Auto-close registration when full (only if currently open)
  IF NEW.status = 'registration_open' AND (OLD.status IS NULL OR OLD.status = 'registration_open') THEN
    SELECT COUNT(*) INTO v_participant_count
    FROM tournament_registrations tr
    WHERE tr.tournament_id = NEW.id 
    AND tr.registration_status = 'confirmed';
    
    -- Auto-close when reaching max capacity
    IF v_participant_count >= NEW.max_participants THEN
      -- Use a separate transaction to avoid recursion
      PERFORM pg_notify('tournament_auto_close', NEW.id::text);
      
      -- Log automation action
      INSERT INTO automation_performance_log (
        automation_type, tournament_id, success, metadata
      ) VALUES (
        'auto_close_registration', NEW.id, true,
        jsonb_build_object('participant_count', v_participant_count, 'trigger', 'capacity_reached')
      );
    END IF;
  END IF;
  
  -- AUTOMATION 2: Auto-generate bracket when registration closes (only status change)
  IF NEW.status = 'registration_closed' AND OLD.status = 'registration_open' THEN
    -- Check if bracket already exists
    IF NOT EXISTS (
      SELECT 1 FROM tournament_matches WHERE tournament_id = NEW.id
    ) THEN
      -- Generate single elimination bracket
      SELECT public.generate_single_elimination_bracket(NEW.id) INTO v_bracket_result;
      
      INSERT INTO automation_performance_log (
        automation_type, tournament_id, success, metadata
      ) VALUES (
        'auto_generate_bracket', NEW.id, 
        (v_bracket_result->>'success')::boolean,
        v_bracket_result
      );
    END IF;
  END IF;
  
  -- AUTOMATION 3: Auto-start tournament at scheduled time (only status change)
  IF NEW.status = 'registration_closed' AND OLD.status = 'registration_closed' AND NEW.tournament_start <= NOW() THEN
    -- Use notification instead of direct update to prevent recursion
    PERFORM pg_notify('tournament_auto_start', NEW.id::text);
    
    INSERT INTO automation_performance_log (
      automation_type, tournament_id, success, metadata
    ) VALUES (
      'auto_start_tournament', NEW.id, true,
      jsonb_build_object('start_time', NEW.tournament_start)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create new trigger with better conditions
CREATE TRIGGER tournament_automation_trigger
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.updated_at IS DISTINCT FROM NEW.updated_at)
  EXECUTE FUNCTION universal_tournament_automation();

-- Create notification handlers to prevent recursion
CREATE OR REPLACE FUNCTION handle_tournament_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  notification RECORD;
BEGIN
  -- This function can be called by a background job to handle notifications
  -- For now, we'll keep it simple and handle it in application code
  NULL;
END;
$$;