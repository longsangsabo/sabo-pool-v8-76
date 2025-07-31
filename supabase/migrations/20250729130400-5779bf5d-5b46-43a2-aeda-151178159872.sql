-- Recreate the missing trigger
CREATE TRIGGER trigger_auto_advance_double_elimination_fixed
  AFTER UPDATE OF winner_id ON tournament_matches
  FOR EACH ROW
  WHEN (NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id))
  EXECUTE FUNCTION trigger_auto_advance_double_elimination_fixed();