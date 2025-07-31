-- Fix loser bracket pairing logic for double elimination
CREATE OR REPLACE FUNCTION advance_loser_to_bracket_fixed(
  p_tournament_id UUID,
  p_winner_match_id UUID,
  p_loser_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_winner_match RECORD;
  v_target_loser_match_number INTEGER;
  v_target_loser_match_id UUID;
  v_placement_position TEXT;
  v_current_player1 UUID;
  v_current_player2 UUID;
  v_updated_rows INTEGER;
BEGIN
  -- Get winner match details
  SELECT * INTO v_winner_match
  FROM tournament_matches
  WHERE id = p_winner_match_id AND tournament_id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Winner match not found'
    );
  END IF;
  
  -- Calculate target loser match based on winner match number
  -- Winner matches 1,2 -> Loser match 1
  -- Winner matches 3,4 -> Loser match 2  
  -- Winner matches 5,6 -> Loser match 3
  -- Winner matches 7,8 -> Loser match 4
  v_target_loser_match_number := CEIL(v_winner_match.match_number::DECIMAL / 2);
  
  -- Determine placement position based on winner match number
  -- Odd winner matches (1,3,5,7) -> player1
  -- Even winner matches (2,4,6,8) -> player2
  v_placement_position := CASE 
    WHEN v_winner_match.match_number % 2 = 1 THEN 'player1'
    ELSE 'player2'
  END;
  
  -- Get target loser match
  SELECT id, player1_id, player2_id 
  INTO v_target_loser_match_id, v_current_player1, v_current_player2
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
    AND bracket_type = 'loser'
    AND round_number = 1
    AND match_number = v_target_loser_match_number;
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Target loser match not found',
      'target_match_number', v_target_loser_match_number
    );
  END IF;
  
  -- Place loser in correct position
  IF v_placement_position = 'player1' THEN
    IF v_current_player1 IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Player1 position already filled',
        'target_match', v_target_loser_match_number,
        'current_player1', v_current_player1
      );
    END IF;
    
    UPDATE tournament_matches
    SET player1_id = p_loser_id,
        updated_at = NOW()
    WHERE id = v_target_loser_match_id;
    
  ELSE -- player2
    IF v_current_player2 IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Player2 position already filled',
        'target_match', v_target_loser_match_number,
        'current_player2', v_current_player2
      );
    END IF;
    
    UPDATE tournament_matches
    SET player2_id = p_loser_id,
        updated_at = NOW()
    WHERE id = v_target_loser_match_id;
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
    'from_winner_match', v_winner_match.match_number,
    'to_loser_match', v_target_loser_match_number,
    'position', v_placement_position,
    'target_match_id', v_target_loser_match_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Exception: %s', SQLERRM)
    );
END;
$$;

-- Test the fixed pairing logic
SELECT advance_loser_to_bracket_fixed(
  (SELECT id FROM tournaments WHERE name ILIKE '%Development Test%' ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM tournament_matches WHERE tournament_id = (SELECT id FROM tournaments WHERE name ILIKE '%Development Test%' ORDER BY created_at DESC LIMIT 1) AND round_number = 1 AND match_number = 1 AND bracket_type = 'winner'),
  (SELECT player1_id FROM tournament_matches WHERE tournament_id = (SELECT id FROM tournaments WHERE name ILIKE '%Development Test%' ORDER BY created_at DESC LIMIT 1) AND round_number = 1 AND match_number = 1 AND bracket_type = 'winner' AND winner_id != player1_id)
) as test_result;