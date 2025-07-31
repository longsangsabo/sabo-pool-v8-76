-- Create trigger for automatic double elimination advancement
CREATE OR REPLACE FUNCTION trigger_double_elimination_advancement()
RETURNS TRIGGER AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only trigger when a match is completed with a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Check if this is a double elimination tournament
    IF EXISTS (
      SELECT 1 FROM tournaments 
      WHERE id = NEW.tournament_id 
      AND tournament_type = 'double_elimination'
    ) THEN
      -- Call advancement function
      SELECT public.advance_double_elimination_winner(NEW.id) INTO v_result;
      
      RAISE NOTICE 'Double elimination advancement result: %', v_result;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on tournament_matches table
DROP TRIGGER IF EXISTS trigger_double_elimination_auto_advance ON tournament_matches;
CREATE TRIGGER trigger_double_elimination_auto_advance
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_double_elimination_advancement();