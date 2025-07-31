-- Ensure tournament winner advancement automation works immediately after match completion
-- Drop and recreate the trigger to ensure it's active

-- First, check and recreate the trigger function
CREATE OR REPLACE FUNCTION public.trigger_advance_tournament_winner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only trigger on matches that have been completed with a winner
  -- And the winner was just set (changed from NULL or different winner)
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Log the trigger execution
    RAISE NOTICE 'Auto-advancing winner % for match % in tournament %', NEW.winner_id, NEW.id, NEW.tournament_id;
    
    -- Call the advance winner function
    SELECT public.advance_tournament_winner(NEW.id, NEW.winner_id) INTO v_result;
    
    -- Log the result for debugging
    RAISE NOTICE 'Advancement result: %', v_result;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger and recreate it
DROP TRIGGER IF EXISTS trigger_auto_advance_winner ON public.tournament_matches;
CREATE TRIGGER trigger_auto_advance_winner
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_advance_tournament_winner();

-- Also ensure we have a trigger that activates when scores are updated
DROP TRIGGER IF EXISTS trigger_auto_advance_on_score_update ON public.tournament_matches;
CREATE TRIGGER trigger_auto_advance_on_score_update
  AFTER UPDATE OF score_player1, score_player2, winner_id, status ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_advance_tournament_winner();