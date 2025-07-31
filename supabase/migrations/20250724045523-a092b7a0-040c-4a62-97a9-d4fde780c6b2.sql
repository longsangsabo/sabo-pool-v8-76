-- Create missing advance_double_elimination_loser function
CREATE OR REPLACE FUNCTION public.advance_double_elimination_loser(
  p_match_id uuid,
  p_loser_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_loser_bracket_match RECORD;
  v_result jsonb;
BEGIN
  -- Get current match details
  SELECT * INTO v_match
  FROM tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Only handle winner bracket matches for loser placement
  IF v_match.bracket_type != 'winner' THEN
    RETURN jsonb_build_object('info', 'Only winner bracket matches place losers');
  END IF;
  
  -- Find appropriate loser bracket match to place the loser
  SELECT * INTO v_loser_bracket_match
  FROM tournament_matches
  WHERE tournament_id = v_match.tournament_id
    AND bracket_type = 'loser'
    AND status = 'pending'
    AND (player1_id IS NULL OR player2_id IS NULL)
    AND round_number >= v_match.round_number + 3  -- Loser bracket starts at round 4
  ORDER BY round_number ASC, match_number ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('warning', 'No available loser bracket match found');
  END IF;
  
  -- Place loser in the loser bracket match
  IF v_loser_bracket_match.player1_id IS NULL THEN
    UPDATE tournament_matches
    SET player1_id = p_loser_id,
        updated_at = NOW()
    WHERE id = v_loser_bracket_match.id;
  ELSE
    UPDATE tournament_matches
    SET player2_id = p_loser_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE id = v_loser_bracket_match.id;
  END IF;
  
  -- Log the placement
  INSERT INTO automation_performance_log (
    automation_type, success, details
  ) VALUES (
    'loser_bracket_placement',
    true,
    jsonb_build_object(
      'match_id', p_match_id,
      'loser_id', p_loser_id,
      'placed_in_match', v_loser_bracket_match.id,
      'loser_bracket_round', v_loser_bracket_match.round_number
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'loser_id', p_loser_id,
    'placed_in_match', v_loser_bracket_match.id,
    'loser_bracket_round', v_loser_bracket_match.round_number,
    'message', 'Loser successfully placed in loser bracket'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to place loser: ' || SQLERRM
    );
END;
$$;

-- Update edge function routing to use correct functions based on tournament type
CREATE OR REPLACE FUNCTION public.route_bracket_generation(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_result jsonb;
BEGIN
  -- Get tournament type
  SELECT tournament_type INTO v_tournament
  FROM tournaments
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Route to appropriate function based on tournament type
  CASE v_tournament.tournament_type
    WHEN 'single_elimination' THEN
      SELECT generate_complete_tournament_bracket(p_tournament_id) INTO v_result;
    WHEN 'double_elimination' THEN
      SELECT create_double_elimination_bracket_v2(p_tournament_id) INTO v_result;
    ELSE
      RETURN jsonb_build_object('error', 'Unsupported tournament type: ' || v_tournament.tournament_type);
  END CASE;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Bracket generation failed: ' || SQLERRM
    );
END;
$$;