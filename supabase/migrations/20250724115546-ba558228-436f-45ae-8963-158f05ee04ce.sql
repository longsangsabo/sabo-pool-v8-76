-- Create trigger for auto-advancement after match completion
CREATE TRIGGER trigger_branched_tournament_match_completion
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_branched_auto_advance_winner();