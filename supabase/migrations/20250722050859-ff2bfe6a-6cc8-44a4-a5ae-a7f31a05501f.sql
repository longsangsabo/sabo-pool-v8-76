
-- Step 1: Fix database inconsistency - Update matches with winner_id but wrong status
UPDATE public.tournament_matches 
SET status = 'completed',
    updated_at = NOW()
WHERE winner_id IS NOT NULL 
  AND status != 'completed';

-- Step 2: Create enhanced advance function that handles all cases
CREATE OR REPLACE FUNCTION public.advance_winner_to_next_round_enhanced(
  p_match_id UUID, 
  p_force_advance BOOLEAN DEFAULT FALSE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_next_match RECORD;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_is_player1_slot BOOLEAN;
  v_max_rounds INTEGER;
BEGIN
  -- Get match details (accept both completed and matches with winner_id)
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id 
    AND (status = 'completed' OR winner_id IS NOT NULL OR p_force_advance = TRUE)
    AND winner_id IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found, not completed, or no winner');
  END IF;
  
  -- Ensure match status is consistent
  IF v_match.status != 'completed' AND v_match.winner_id IS NOT NULL THEN
    UPDATE tournament_matches 
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_match_id;
  END IF;
  
  -- Calculate next round and match position
  v_next_round := v_match.round_number + 1;
  v_next_match_number := CEIL(v_match.match_number::NUMERIC / 2);
  
  -- Get max rounds for this tournament
  SELECT MAX(round_number) INTO v_max_rounds
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id;
  
  -- Check if this was the final match
  IF v_match.round_number >= v_max_rounds THEN
    -- This was the final match - complete tournament
    UPDATE tournaments 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'tournament_complete', true,
      'champion_id', v_match.winner_id,
      'message', 'Tournament completed successfully'
    );
  END IF;
  
  -- Find next round match
  SELECT * INTO v_next_match
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id 
    AND round_number = v_next_round 
    AND match_number = v_next_match_number;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Next round match not found');
  END IF;
  
  -- Determine slot based on bracket progression logic
  v_is_player1_slot := (v_match.match_number % 2 = 1);
  
  -- Advance winner to correct slot
  IF v_is_player1_slot THEN
    UPDATE tournament_matches 
    SET player1_id = v_match.winner_id,
        player2_id = CASE 
          WHEN player2_id = v_match.winner_id THEN NULL 
          ELSE player2_id 
        END,
        status = CASE 
          WHEN player2_id IS NOT NULL AND player2_id != v_match.winner_id THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = v_match.winner_id,
        player1_id = CASE 
          WHEN player1_id = v_match.winner_id THEN NULL 
          ELSE player1_id 
        END,
        status = CASE 
          WHEN player1_id IS NOT NULL AND player1_id != v_match.winner_id THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'advanced_to_round', v_next_round,
    'advanced_to_match', v_next_match_number,
    'winner_id', v_match.winner_id,
    'slot', CASE WHEN v_is_player1_slot THEN 'player1' ELSE 'player2' END,
    'message', 'Winner advanced to next round successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM
    );
END;
$$;

-- Step 3: Create automatic trigger for winner advancement
CREATE OR REPLACE FUNCTION public.trigger_winner_advancement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger if winner_id is being set and wasn't set before
  IF NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    -- Ensure status is completed when winner is set
    IF NEW.status != 'completed' THEN
      NEW.status := 'completed';
      NEW.updated_at := NOW();
    END IF;
    
    -- Trigger advancement in a separate transaction to avoid recursion
    PERFORM pg_notify('winner_advancement', json_build_object(
      'match_id', NEW.id,
      'winner_id', NEW.winner_id,
      'tournament_id', NEW.tournament_id
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on tournament_matches
DROP TRIGGER IF EXISTS trigger_advance_winner ON public.tournament_matches;
CREATE TRIGGER trigger_advance_winner
  BEFORE UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_winner_advancement();

-- Step 4: Create comprehensive tournament fix function
CREATE OR REPLACE FUNCTION public.fix_all_tournament_progression(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_result JSONB;
  v_fixed_count INTEGER := 0;
  v_errors TEXT[] := '{}';
BEGIN
  -- First, fix any inconsistent statuses
  UPDATE tournament_matches 
  SET status = 'completed', updated_at = NOW()
  WHERE tournament_id = p_tournament_id 
    AND winner_id IS NOT NULL 
    AND status != 'completed';
  
  -- Reset all matches from round 2 onwards to ensure clean state
  UPDATE tournament_matches 
  SET player1_id = NULL,
      player2_id = NULL,
      status = 'pending',
      updated_at = NOW()
  WHERE tournament_id = p_tournament_id 
    AND round_number > 1
    AND winner_id IS NULL;
  
  -- Process all completed matches in order
  FOR v_match IN 
    SELECT id, winner_id, round_number, match_number
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    SELECT public.advance_winner_to_next_round_enhanced(v_match.id, TRUE) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
      v_fixed_count := v_fixed_count + 1;
    ELSE
      v_errors := array_append(v_errors, 'Round ' || v_match.round_number || ' Match ' || v_match.match_number || ': ' || (v_result->>'error'));
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', v_fixed_count > 0,
    'tournament_id', p_tournament_id,
    'fixed_matches', v_fixed_count,
    'errors', v_errors,
    'message', 'Fixed ' || v_fixed_count || ' match progressions'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to fix tournament progression: ' || SQLERRM
    );
END;
$$;

-- Step 5: Run fix for current tournament test2
SELECT public.fix_all_tournament_progression('2b252d70-5cf3-427f-92b7-48eea40753d8');
