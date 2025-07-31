-- Fix tournament status inconsistency and add real-time trigger for results
-- Problem: Tournament has completed_at but status is still "registration_open"

-- First, fix the specific tournament status
UPDATE tournaments 
SET status = 'completed',
    updated_at = NOW()
WHERE id = 'acd33d20-b841-474d-a754-31a33647cc93' 
AND completed_at IS NOT NULL 
AND status != 'completed';

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.auto_update_tournament_status();

-- Add trigger to automatically update tournament status when completed_at is set
CREATE OR REPLACE FUNCTION public.auto_update_tournament_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Auto-update status to completed when completed_at is set
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    NEW.status = 'completed';
    NEW.updated_at = NOW();
  END IF;
  
  -- Auto-update status back if completed_at is cleared
  IF NEW.completed_at IS NULL AND OLD.completed_at IS NOT NULL THEN
    -- Only change from completed if it was completed
    IF OLD.status = 'completed' THEN
      NEW.status = 'ongoing';
      NEW.updated_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic status updates
DROP TRIGGER IF EXISTS auto_update_tournament_status_trigger ON tournaments;
CREATE TRIGGER auto_update_tournament_status_trigger
  BEFORE UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_tournament_status();

-- Enable realtime for tournament_results table for immediate updates
ALTER TABLE tournament_results REPLICA IDENTITY FULL;