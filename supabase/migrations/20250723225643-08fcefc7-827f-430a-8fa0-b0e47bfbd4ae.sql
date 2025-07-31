-- Recreate the enhanced winner advancement trigger system
-- This ensures that when a match is completed with a winner, it automatically advances to the next round

-- First, drop existing triggers if they exist to avoid conflicts
DROP TRIGGER IF EXISTS enhanced_winner_advancement_trigger ON public.tournament_matches;
DROP TRIGGER IF EXISTS enhanced_tournament_completion_trigger ON public.tournament_matches;

-- Create the enhanced winner advancement trigger
CREATE TRIGGER enhanced_winner_advancement_trigger
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
        (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id))
  EXECUTE FUNCTION public.enhanced_winner_advancement_trigger();

-- Create the enhanced tournament completion trigger  
CREATE TRIGGER enhanced_tournament_completion_trigger
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.winner_id IS NOT NULL)
  EXECUTE FUNCTION public.enhanced_tournament_completion_trigger();

-- Also ensure we have the notification trigger
DROP TRIGGER IF EXISTS notify_winner_advancement_trigger ON public.tournament_matches;

CREATE TRIGGER notify_winner_advancement_trigger
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  WHEN (NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id))
  EXECUTE FUNCTION public.notify_winner_advancement();

-- Test the advance function on a completed match to see if it works
-- This will help identify any issues with the function logic