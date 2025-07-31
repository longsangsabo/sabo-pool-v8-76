-- Create trigger for automatic double elimination advancement
CREATE OR REPLACE FUNCTION public.trigger_advance_double_elimination_winner()
RETURNS TRIGGER AS $$
DECLARE
  v_result JSONB;
  v_tournament_type TEXT;
BEGIN
  -- Only process when match status changes to completed and has a winner
  IF NEW.status = 'completed' 
     AND NEW.winner_id IS NOT NULL 
     AND (OLD.status != 'completed' OR OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Check if this is a double elimination tournament
    SELECT tournament_type INTO v_tournament_type
    FROM tournaments 
    WHERE id = NEW.tournament_id;
    
    IF v_tournament_type = 'double_elimination' THEN
      RAISE NOTICE 'Auto-advancing double elimination winner % for match %', NEW.winner_id, NEW.id;
      
      -- Call the comprehensive advancement function
      BEGIN
        SELECT public.advance_double_elimination_winner_comprehensive(NEW.id) INTO v_result;
        RAISE NOTICE 'Double elimination advancement result: %', v_result;
        
        -- Log the automation
        INSERT INTO public.tournament_automation_log (
          tournament_id,
          automation_type,
          status,
          details,
          completed_at
        ) VALUES (
          NEW.tournament_id,
          'auto_double_elimination_advancement',
          CASE WHEN (v_result->>'success')::boolean THEN 'completed' ELSE 'failed' END,
          jsonb_build_object(
            'match_id', NEW.id,
            'winner_id', NEW.winner_id,
            'bracket_type', NEW.bracket_type,
            'round_number', NEW.round_number,
            'advancement_result', v_result
          ),
          CASE WHEN (v_result->>'success')::boolean THEN NOW() ELSE NULL END
        );
        
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to auto-advance double elimination winner for match %: %', NEW.id, SQLERRM;
          
          -- Log the error
          INSERT INTO public.tournament_automation_log (
            tournament_id,
            automation_type,
            status,
            details,
            error_message,
            completed_at
          ) VALUES (
            NEW.tournament_id,
            'auto_double_elimination_advancement',
            'failed',
            jsonb_build_object(
              'match_id', NEW.id,
              'winner_id', NEW.winner_id,
              'bracket_type', NEW.bracket_type,
              'round_number', NEW.round_number
            ),
            SQLERRM,
            NULL
          );
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_advance_double_elimination_winner ON tournament_matches;
CREATE TRIGGER trigger_advance_double_elimination_winner
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_advance_double_elimination_winner();