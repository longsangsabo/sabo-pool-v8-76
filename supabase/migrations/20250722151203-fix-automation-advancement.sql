
-- Fix automation for test6 tournament and improve the advancement function
-- First, let's check the current status and advance Round 2 winners to Round 3

-- Get Round 2 winners and advance them to Round 3
DO $$
DECLARE
  r2_match1_winner UUID;
  r2_match2_winner UUID; 
  r2_match3_winner UUID;
  r2_match4_winner UUID;
BEGIN
  -- Get Round 2 winners from test6 tournament
  SELECT winner_id INTO r2_match1_winner
  FROM tournament_matches 
  WHERE tournament_id = '059309d0-67aa-4f82-884e-92bb24c57d3b' 
  AND round_number = 2 AND match_number = 1 AND status = 'completed';
  
  SELECT winner_id INTO r2_match2_winner
  FROM tournament_matches 
  WHERE tournament_id = '059309d0-67aa-4f82-884e-92bb24c57d3b' 
  AND round_number = 2 AND match_number = 2 AND status = 'completed';
  
  SELECT winner_id INTO r2_match3_winner
  FROM tournament_matches 
  WHERE tournament_id = '059309d0-67aa-4f82-884e-92bb24c57d3b' 
  AND round_number = 2 AND match_number = 3 AND status = 'completed';
  
  SELECT winner_id INTO r2_match4_winner
  FROM tournament_matches 
  WHERE tournament_id = '059309d0-67aa-4f82-884e-92bb24c57d3b' 
  AND round_number = 2 AND match_number = 4 AND status = 'completed';
  
  -- Advance winners to Round 3 (semifinals)
  -- Match 1 & 2 winners go to R3 Match 1
  IF r2_match1_winner IS NOT NULL AND r2_match2_winner IS NOT NULL THEN
    UPDATE tournament_matches 
    SET player1_id = r2_match1_winner,
        player2_id = r2_match2_winner,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = '059309d0-67aa-4f82-884e-92bb24c57d3b' 
    AND round_number = 3 AND match_number = 1;
    
    RAISE NOTICE 'Advanced R2 winners % and % to R3 Match 1', r2_match1_winner, r2_match2_winner;
  END IF;
  
  -- Match 3 & 4 winners go to R3 Match 2  
  IF r2_match3_winner IS NOT NULL AND r2_match4_winner IS NOT NULL THEN
    UPDATE tournament_matches 
    SET player1_id = r2_match3_winner,
        player2_id = r2_match4_winner,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = '059309d0-67aa-4f82-884e-92bb24c57d3b' 
    AND round_number = 3 AND match_number = 2;
    
    RAISE NOTICE 'Advanced R2 winners % and % to R3 Match 2', r2_match3_winner, r2_match4_winner;
  END IF;
END $$;

-- Fix the automation trigger to ensure it fires correctly
CREATE OR REPLACE FUNCTION public.trigger_advance_tournament_winner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    
    -- Call the advance winner function with force=true to ensure it works
    SELECT public.advance_winner_to_next_round(NEW.id, TRUE) INTO v_result;
    
    -- Log the result for debugging
    RAISE NOTICE 'Advancement result: %', v_result;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS trigger_auto_advance_winner ON public.tournament_matches;
CREATE TRIGGER trigger_auto_advance_winner
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_advance_tournament_winner();

-- Also ensure tournament status updates when all matches complete
CREATE OR REPLACE FUNCTION public.check_tournament_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_matches INTEGER;
  v_completed_matches INTEGER;
  v_final_round INTEGER;
  v_final_match_completed BOOLEAN;
BEGIN
  -- Get tournament stats
  SELECT COUNT(*) INTO v_total_matches
  FROM tournament_matches 
  WHERE tournament_id = NEW.tournament_id;
  
  SELECT COUNT(*) INTO v_completed_matches
  FROM tournament_matches 
  WHERE tournament_id = NEW.tournament_id AND status = 'completed';
  
  -- Get final round
  SELECT MAX(round_number) INTO v_final_round
  FROM tournament_matches 
  WHERE tournament_id = NEW.tournament_id;
  
  -- Check if final match is completed
  SELECT COUNT(*) > 0 INTO v_final_match_completed
  FROM tournament_matches 
  WHERE tournament_id = NEW.tournament_id 
  AND round_number = v_final_round 
  AND match_number = 1 
  AND status = 'completed';
  
  -- If final match is completed, mark tournament as completed
  IF v_final_match_completed THEN
    UPDATE tournaments 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.tournament_id;
    
    RAISE NOTICE 'Tournament % marked as completed', NEW.tournament_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for tournament completion
DROP TRIGGER IF EXISTS trigger_check_tournament_completion ON public.tournament_matches;
CREATE TRIGGER trigger_check_tournament_completion
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.check_tournament_completion();
