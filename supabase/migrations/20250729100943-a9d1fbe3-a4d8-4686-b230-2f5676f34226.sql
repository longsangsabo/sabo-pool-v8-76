-- Add the V9 auto-advancement trigger to tournament_matches table
-- First drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_advance_double_elimination_auto ON tournament_matches;

-- Create new V9 trigger
CREATE TRIGGER trigger_advance_double_elimination_v9_auto
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_advance_double_elimination_v9();