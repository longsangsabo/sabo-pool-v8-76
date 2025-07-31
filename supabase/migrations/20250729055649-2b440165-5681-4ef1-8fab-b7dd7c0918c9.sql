-- Fix auto status update trigger to also work on INSERT
CREATE OR REPLACE FUNCTION public.auto_update_match_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto change pending -> scheduled when players are assigned
  IF NEW.player1_id IS NOT NULL AND NEW.player2_id IS NOT NULL AND NEW.status = 'pending' THEN
    NEW.status := 'scheduled';
    NEW.updated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to work on both INSERT and UPDATE
DROP TRIGGER IF EXISTS auto_match_status_trigger ON tournament_matches;
CREATE TRIGGER auto_match_status_trigger
  BEFORE INSERT OR UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_match_status();

-- Update existing matches that should be scheduled
UPDATE tournament_matches 
SET status = 'scheduled', updated_at = NOW()
WHERE status = 'pending' 
  AND player1_id IS NOT NULL 
  AND player2_id IS NOT NULL;