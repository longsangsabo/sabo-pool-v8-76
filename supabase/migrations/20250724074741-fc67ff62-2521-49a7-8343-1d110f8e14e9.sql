-- Function to properly advance losers from winner bracket to loser bracket
CREATE OR REPLACE FUNCTION public.advance_loser_to_bracket(
  p_match_id UUID, 
  p_loser_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_loser_match RECORD;
  v_target_round INTEGER;
  v_target_match_number INTEGER;
  v_target_slot TEXT;
  v_updated_rows INTEGER;
BEGIN
  -- Get the completed match details
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id 
  AND status = 'completed'
  AND bracket_type = 'winner';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Winner match not found or not completed'
    );
  END IF;
  
  -- For double elimination: losers from Winner Round 1 go to Loser Round 1
  -- Losers from Winner Round N go to specific positions in loser bracket
  IF v_match.round_number = 1 THEN
    v_target_round := 1;
    -- Map winner match to loser match position
    -- Winner Match 1,2 -> Loser Round 1 Match 1,2 etc.
    v_target_match_number := v_match.match_number;
  ELSE
    -- For higher rounds, more complex mapping needed
    v_target_round := (v_match.round_number - 1) * 2;
    v_target_match_number := CEIL(v_match.match_number::DECIMAL / 2);
  END IF;
  
  -- Find the target loser match
  SELECT * INTO v_loser_match
  FROM tournament_matches
  WHERE tournament_id = v_match.tournament_id
  AND bracket_type = 'loser'
  AND round_number = v_target_round
  AND match_number = v_target_match_number;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Target loser match not found: Round %s, Match %s', v_target_round, v_target_match_number)
    );
  END IF;
  
  -- Determine which slot to fill (player1 or player2)
  IF v_loser_match.player1_id IS NULL THEN
    v_target_slot := 'player1';
    UPDATE tournament_matches 
    SET player1_id = p_loser_id, updated_at = NOW()
    WHERE id = v_loser_match.id;
  ELSIF v_loser_match.player2_id IS NULL THEN
    v_target_slot := 'player2';
    UPDATE tournament_matches 
    SET player2_id = p_loser_id, updated_at = NOW()
    WHERE id = v_loser_match.id;
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Target loser match already full'
    );
  END IF;
  
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  
  IF v_updated_rows = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to update loser match'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'loser_id', p_loser_id,
    'target_match_id', v_loser_match.id,
    'target_round', v_target_round,
    'target_match_number', v_target_match_number,
    'target_slot', v_target_slot,
    'winner_match_round', v_match.round_number,
    'winner_match_number', v_match.match_number
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Exception: %s', SQLERRM)
    );
END;
$$;

-- Function to fix all missing loser advancements for a tournament
CREATE OR REPLACE FUNCTION public.fix_loser_bracket_advancements(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_completed_match RECORD;
  v_loser_id UUID;
  v_advancement_result JSONB;
  v_total_fixed INTEGER := 0;
  v_total_errors INTEGER := 0;
  v_errors JSONB[] := '{}';
BEGIN
  -- Process all completed winner bracket matches
  FOR v_completed_match IN
    SELECT * FROM tournament_matches 
    WHERE tournament_id = p_tournament_id
    AND bracket_type = 'winner' 
    AND status = 'completed'
    AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    -- Determine the loser
    v_loser_id := CASE 
      WHEN v_completed_match.winner_id = v_completed_match.player1_id THEN v_completed_match.player2_id
      ELSE v_completed_match.player1_id
    END;
    
    -- Check if this loser is already placed in loser bracket
    IF NOT EXISTS (
      SELECT 1 FROM tournament_matches 
      WHERE tournament_id = p_tournament_id
      AND bracket_type = 'loser'
      AND (player1_id = v_loser_id OR player2_id = v_loser_id)
    ) THEN
      -- Advance the loser
      SELECT public.advance_loser_to_bracket(v_completed_match.id, v_loser_id) INTO v_advancement_result;
      
      IF (v_advancement_result->>'success')::boolean THEN
        v_total_fixed := v_total_fixed + 1;
      ELSE
        v_total_errors := v_total_errors + 1;
        v_errors := v_errors || v_advancement_result;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'total_fixed', v_total_fixed,
    'total_errors', v_total_errors,
    'errors', v_errors,
    'fixed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Exception: %s', SQLERRM)
    );
END;
$$;