-- Fix advance_sabo_tournament_fixed to use double1_advancement_rules table
CREATE OR REPLACE FUNCTION public.advance_sabo_tournament_fixed(
  p_tournament_id UUID,
  p_completed_match_id UUID DEFAULT NULL,
  p_winner_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_result JSONB;
  v_completed_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_advancement_rule RECORD;
  v_target_match RECORD;
  v_total_advanced INTEGER := 0;
  v_errors TEXT[] := '{}';
BEGIN
  -- If specific match provided, advance that match
  IF p_completed_match_id IS NOT NULL THEN
    -- Get match details
    SELECT * INTO v_completed_match
    FROM tournament_matches 
    WHERE id = p_completed_match_id AND tournament_id = p_tournament_id;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Match not found');
    END IF;
    
    -- Determine winner and loser
    v_winner_id := COALESCE(p_winner_id, v_completed_match.winner_id);
    v_loser_id := CASE 
      WHEN v_winner_id = v_completed_match.player1_id THEN v_completed_match.player2_id
      ELSE v_completed_match.player1_id
    END;
    
    -- Process winner advancement
    FOR v_advancement_rule IN 
      SELECT * FROM double1_advancement_rules
      WHERE from_bracket = v_completed_match.bracket_type
      AND from_round = v_completed_match.round_number  
      AND from_match = v_completed_match.match_number
      AND player_role = 'winner'
    LOOP
      -- Find target match
      SELECT * INTO v_target_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
      AND bracket_type = v_advancement_rule.to_bracket
      AND round_number = v_advancement_rule.to_round
      AND match_number = v_advancement_rule.to_match;
      
      IF FOUND THEN
        -- Place winner in correct position
        IF v_advancement_rule.to_position = 'player1' THEN
          UPDATE tournament_matches 
          SET player1_id = v_winner_id
          WHERE id = v_target_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_winner_id  
          WHERE id = v_target_match.id;
        END IF;
        v_total_advanced := v_total_advanced + 1;
      END IF;
    END LOOP;
    
    -- Process loser advancement  
    FOR v_advancement_rule IN
      SELECT * FROM double1_advancement_rules
      WHERE from_bracket = v_completed_match.bracket_type
      AND from_round = v_completed_match.round_number
      AND from_match = v_completed_match.match_number  
      AND player_role = 'loser'
    LOOP
      -- Find target match
      SELECT * INTO v_target_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
      AND bracket_type = v_advancement_rule.to_bracket
      AND round_number = v_advancement_rule.to_round
      AND match_number = v_advancement_rule.to_match;
      
      IF FOUND THEN
        -- Place loser in correct position
        IF v_advancement_rule.to_position = 'player1' THEN
          UPDATE tournament_matches
          SET player1_id = v_loser_id
          WHERE id = v_target_match.id;
        ELSE
          UPDATE tournament_matches
          SET player2_id = v_loser_id
          WHERE id = v_target_match.id;
        END IF;
        v_total_advanced := v_total_advanced + 1;
      END IF;
    END LOOP;
  ELSE
    -- Auto-advance all completed matches that haven't been processed
    FOR v_completed_match IN
      SELECT * FROM tournament_matches
      WHERE tournament_id = p_tournament_id
      AND status = 'completed'
      AND winner_id IS NOT NULL
      ORDER BY round_number, match_number
    LOOP
      -- Check if advancement already happened by looking for rules
      IF EXISTS (
        SELECT 1 FROM double1_advancement_rules dar
        WHERE dar.from_bracket = v_completed_match.bracket_type
        AND dar.from_round = v_completed_match.round_number
        AND dar.from_match = v_completed_match.match_number
      ) THEN
        -- Process this match advancement
        SELECT advance_sabo_tournament_fixed(p_tournament_id, v_completed_match.id, v_completed_match.winner_id) INTO v_result;
        IF v_result ? 'total_advanced' THEN
          v_total_advanced := v_total_advanced + (v_result->>'total_advanced')::INTEGER;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'total_advanced', v_total_advanced,
    'message', format('Advanced %s players using new advancement rules', v_total_advanced)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$function$;

-- Function to immediately fix tournament double6
CREATE OR REPLACE FUNCTION public.fix_double6_tournament_immediately()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_tournament_id UUID := '2a6c88fe-07ec-4d29-bbf4-cc829439a7f8';
  v_result JSONB;
  v_fixed_count INTEGER := 0;
BEGIN
  -- Reset all matches from Round 2+ to remove duplicates
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, winner_id = NULL, status = 'pending'
  WHERE tournament_id = v_tournament_id
  AND (round_number > 1 OR round_number > 100);
  
  GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
  
  -- Now re-advance all Round 1 completed matches using new logic
  SELECT advance_sabo_tournament_fixed(v_tournament_id, NULL, NULL) INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'matches_reset', v_fixed_count,
    'advancement_result', v_result,
    'message', 'Fixed double6 tournament using new advancement rules'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', v_tournament_id
    );
END;
$function$;