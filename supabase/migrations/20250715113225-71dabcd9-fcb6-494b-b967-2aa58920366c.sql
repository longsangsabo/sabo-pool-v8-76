-- Create automation trigger for match status updates
CREATE OR REPLACE FUNCTION update_match_status_on_score_input()
RETURNS TRIGGER AS $$
BEGIN
  -- When score is submitted for the first time, change status to in_progress
  IF NEW.score_status = 'pending_confirmation' AND OLD.score_status IS NULL THEN
    NEW.status = 'in_progress';
    NEW.actual_start_time = COALESCE(NEW.actual_start_time, NOW());
  END IF;
  
  -- When score is confirmed, set match as completed with winner
  IF NEW.score_status = 'confirmed' AND OLD.score_status = 'pending_confirmation' THEN
    NEW.status = 'completed';
    NEW.actual_end_time = COALESCE(NEW.actual_end_time, NOW());
    
    -- Auto-determine winner if not set
    IF NEW.winner_id IS NULL THEN
      IF NEW.score_player1 > NEW.score_player2 THEN
        NEW.winner_id = NEW.player1_id;
      ELSIF NEW.score_player2 > NEW.score_player1 THEN
        NEW.winner_id = NEW.player2_id;
      END IF;
    END IF;
  END IF;
  
  -- When score is disputed, reset to scheduled
  IF NEW.score_status = 'disputed' AND OLD.score_status = 'pending_confirmation' THEN
    NEW.status = 'scheduled';
    NEW.score_player1 = NULL;
    NEW.score_player2 = NULL;
    NEW.score_input_by = NULL;
    NEW.score_submitted_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS tournament_match_score_automation ON tournament_matches;
CREATE TRIGGER tournament_match_score_automation
  BEFORE UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_match_status_on_score_input();