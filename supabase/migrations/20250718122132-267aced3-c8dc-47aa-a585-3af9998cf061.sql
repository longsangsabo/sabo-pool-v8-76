-- Fixed function to advance winner with proper bracket logic
CREATE OR REPLACE FUNCTION public.advance_single_elimination_winner(p_match_id UUID)
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
  -- Get completed match details
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id 
    AND status = 'completed' 
    AND winner_id IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found or not completed');
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
    -- This was the final match
    UPDATE tournaments 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    -- Calculate final results
    PERFORM public.calculate_single_elimination_results(v_match.tournament_id);
    
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
  
  -- Determine correct slot based on match pairing logic
  -- For single elimination: match 1,2 -> match 1, match 3,4 -> match 2, etc.
  v_is_player1_slot := (v_match.match_number % 2 = 1);
  
  -- Advance winner to correct slot in next match
  IF v_is_player1_slot THEN
    -- Winner from odd numbered matches goes to player1 slot
    UPDATE tournament_matches 
    SET player1_id = v_match.winner_id,
        status = CASE 
          WHEN player2_id IS NOT NULL AND player2_id != v_match.winner_id THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  ELSE
    -- Winner from even numbered matches goes to player2 slot
    UPDATE tournament_matches 
    SET player2_id = v_match.winner_id,
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
    'message', 'Winner advanced to next round'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM
    );
END;
$$;

-- Function to fix broken tournament bracket progression
CREATE OR REPLACE FUNCTION public.fix_tournament_bracket_progression(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_result JSONB;
BEGIN
  -- Reset all matches in rounds 2 and higher to pending state
  UPDATE tournament_matches 
  SET player1_id = NULL,
      player2_id = NULL,
      score_player1 = 0,
      score_player2 = 0,
      winner_id = NULL,
      status = 'pending',
      updated_at = NOW()
  WHERE tournament_id = p_tournament_id 
    AND round_number > 1;
  
  -- Re-advance all round 1 winners
  FOR v_match IN 
    SELECT id, winner_id 
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND round_number = 1 
      AND status = 'completed' 
      AND winner_id IS NOT NULL
    ORDER BY match_number
  LOOP
    SELECT public.advance_single_elimination_winner(v_match.id) INTO v_result;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'message', 'Tournament bracket progression fixed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to fix bracket: ' || SQLERRM
    );
END;
$$;

-- Fix the broken tournament test2
SELECT public.fix_tournament_bracket_progression('2b252d70-5cf3-427f-92b7-48eea40753d8');