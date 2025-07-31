-- Fix final match automation and tournament completion
-- The issue is that tournament status is 'completed' but final match isn't finished

-- First, fix test6 tournament status since final match isn't completed yet
UPDATE tournaments 
SET status = 'ongoing',
    completed_at = NULL,
    updated_at = NOW()
WHERE name ILIKE '%test6%' 
AND status = 'completed'
AND EXISTS (
  SELECT 1 FROM tournament_matches 
  WHERE tournament_id = tournaments.id 
  AND round_number = (SELECT MAX(round_number) FROM tournament_matches WHERE tournament_id = tournaments.id)
  AND match_number = 1
  AND status = 'scheduled'
  AND winner_id IS NULL
);

-- Enhance the tournament completion trigger to be more accurate
CREATE OR REPLACE FUNCTION public.check_tournament_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_final_round INTEGER;
  v_final_match_completed BOOLEAN;
  v_tournament_status TEXT;
BEGIN
  -- Get current tournament status
  SELECT status INTO v_tournament_status
  FROM tournaments 
  WHERE id = NEW.tournament_id;
  
  -- Only check completion for ongoing tournaments
  IF v_tournament_status != 'ongoing' THEN
    RETURN NEW;
  END IF;
  
  -- Get final round number
  SELECT MAX(round_number) INTO v_final_round
  FROM tournament_matches 
  WHERE tournament_id = NEW.tournament_id;
  
  -- Check if the final match (round_number = max, match_number = 1) is completed with a winner
  SELECT (
    status = 'completed' 
    AND winner_id IS NOT NULL 
    AND is_third_place_match = false
  ) INTO v_final_match_completed
  FROM tournament_matches 
  WHERE tournament_id = NEW.tournament_id 
  AND round_number = v_final_round 
  AND match_number = 1
  AND (is_third_place_match IS NULL OR is_third_place_match = false);
  
  -- If final match is completed, mark tournament as completed
  IF v_final_match_completed THEN
    UPDATE tournaments 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.tournament_id
    AND status != 'completed';
    
    RAISE NOTICE 'Tournament % automatically completed - final match winner: %', NEW.tournament_id, NEW.winner_id;
    
    -- Process tournament completion (award points, etc.)
    PERFORM public.process_tournament_completion(NEW.tournament_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS trigger_check_tournament_completion ON public.tournament_matches;
CREATE TRIGGER trigger_check_tournament_completion
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.winner_id IS NOT NULL)
  EXECUTE FUNCTION public.check_tournament_completion();

-- Enhance the advance winner function to handle final round better
CREATE OR REPLACE FUNCTION public.advance_winner_to_next_round_enhanced(
  p_match_id UUID,
  p_force_advance BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_next_match RECORD;
  v_tournament RECORD;
  v_final_round INTEGER;
  v_is_final_match BOOLEAN;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  IF v_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No winner set for this match');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  -- Get final round number
  SELECT MAX(round_number) INTO v_final_round
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id;
  
  -- Check if this is the final match
  v_is_final_match := (v_match.round_number = v_final_round AND v_match.match_number = 1);
  
  -- If this is the final match, no advancement needed - tournament should be completed by trigger
  IF v_is_final_match THEN
    RAISE NOTICE 'Final match completed - tournament should be marked as completed by trigger';
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Final match completed - tournament completion triggered',
      'final_match', true,
      'winner_id', v_match.winner_id
    );
  END IF;
  
  -- For non-final matches, find next round match
  -- Determine which match in the next round this winner should advance to
  DECLARE
    v_next_match_number INTEGER;
    v_slot_position TEXT;
  BEGIN
    -- Calculate next match number (each pair of matches feeds into one next round match)
    v_next_match_number := CEIL(v_match.match_number::DECIMAL / 2);
    
    -- Determine if winner goes to player1 or player2 slot
    v_slot_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1' ELSE 'player2' END;
    
    -- Find the next round match
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
    AND round_number = v_match.round_number + 1
    AND match_number = v_next_match_number;
    
    IF v_next_match IS NULL THEN
      -- Create next round match if it doesn't exist
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, status
      ) VALUES (
        v_match.tournament_id, v_match.round_number + 1, v_next_match_number, 'scheduled'
      ) RETURNING * INTO v_next_match;
    END IF;
    
    -- Advance winner to appropriate slot
    IF v_slot_position = 'player1' THEN
      UPDATE tournament_matches
      SET player1_id = v_match.winner_id,
          status = CASE 
            WHEN player2_id IS NOT NULL THEN 'scheduled'
            ELSE status
          END,
          updated_at = NOW()
      WHERE id = v_next_match.id;
    ELSE
      UPDATE tournament_matches
      SET player2_id = v_match.winner_id,
          status = CASE 
            WHEN player1_id IS NOT NULL THEN 'scheduled'
            ELSE status
          END,
          updated_at = NOW()
      WHERE id = v_next_match.id;
    END IF;
    
    RAISE NOTICE 'Advanced winner % from match % to next round match % (% slot)', 
      v_match.winner_id, p_match_id, v_next_match.id, v_slot_position;
    
    RETURN jsonb_build_object(
      'success', true,
      'winner_advanced', true,
      'next_match_id', v_next_match.id,
      'slot_position', v_slot_position
    );
  END;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to advance winner: %s', SQLERRM)
    );
END;
$$;