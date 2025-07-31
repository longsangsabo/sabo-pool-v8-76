-- 3. Tạo trigger để tự động advance khi matches hoàn thành
CREATE OR REPLACE FUNCTION auto_advance_tournament_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Chỉ chạy khi match được hoàn thành và có winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.status != 'completed' OR OLD.winner_id IS NULL) THEN
    
    -- Auto advance to semifinal nếu có đủ điều kiện
    SELECT auto_advance_to_semifinal(NEW.tournament_id) INTO v_result;
    
    -- Auto advance to final nếu có đủ điều kiện  
    SELECT auto_advance_to_final(NEW.tournament_id) INTO v_result;
    
    -- Log trigger execution
    INSERT INTO tournament_automation_log (
      tournament_id, automation_type, status, details, completed_at
    ) VALUES (
      NEW.tournament_id, 'auto_advancement_trigger', 'completed',
      jsonb_build_object(
        'match_id', NEW.id,
        'match_round', NEW.round_number,
        'winner_id', NEW.winner_id
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply trigger to tournament_matches
DROP TRIGGER IF EXISTS auto_advance_tournament_trigger ON tournament_matches;
CREATE TRIGGER auto_advance_tournament_trigger
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION auto_advance_tournament_trigger();