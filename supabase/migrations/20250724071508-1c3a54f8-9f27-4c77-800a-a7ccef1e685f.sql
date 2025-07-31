-- Fix branch type mapping in advance_double_elimination_loser function
CREATE OR REPLACE FUNCTION public.advance_double_elimination_loser(p_match_id uuid, p_loser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_target_match RECORD;
  v_target_round INTEGER;
  v_target_match_number INTEGER;
  v_target_branch TEXT;
  v_position TEXT;
  v_updated_rows INTEGER;
BEGIN
  -- Get match details
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament
  FROM tournaments 
  WHERE id = v_match.tournament_id;
  
  IF v_tournament.tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a double elimination tournament');
  END IF;
  
  -- Only process winner bracket matches
  IF v_match.bracket_type != 'winner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only winner bracket matches can send losers');
  END IF;
  
  -- Determine target loser bracket position based on winner bracket round
  CASE v_match.round_number
    WHEN 1 THEN
      -- Round 1 losers go to Loser Bracket Branch A Round 1
      v_target_round := 1;
      v_target_branch := 'branch_a';  -- Fixed: use actual branch_type value
      v_target_match_number := v_match.match_number;
      
    WHEN 2 THEN
      -- Round 2 losers go to Loser Bracket Branch B Round 1
      v_target_round := 1;
      v_target_branch := 'branch_b';  -- Fixed: use actual branch_type value
      v_target_match_number := CASE v_match.match_number
        WHEN 1 THEN 1
        WHEN 2 THEN 2
        ELSE v_match.match_number
      END;
      
    WHEN 3 THEN
      -- Round 3 losers go to Loser Bracket Round 4 (Semifinal)
      v_target_round := 4;
      v_target_branch := 'main';
      v_target_match_number := 1;
      
    WHEN 4 THEN
      -- Final loser goes to Loser Bracket Final (Round 5)
      v_target_round := 5;
      v_target_branch := 'main';
      v_target_match_number := 1;
      
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Invalid winner bracket round for loser advancement');
  END CASE;
  
  -- Find target loser bracket match
  SELECT * INTO v_target_match
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id
    AND bracket_type = 'loser'
    AND round_number = v_target_round
    AND match_number = v_target_match_number
    AND branch_type = v_target_branch;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Target loser bracket match not found: round=%s, match=%s, branch=%s', 
                     v_target_round, v_target_match_number, v_target_branch)
    );
  END IF;
  
  -- Determine position (player1 or player2) in target match
  IF v_target_match.player1_id IS NULL THEN
    v_position := 'player1';
  ELSIF v_target_match.player2_id IS NULL THEN
    v_position := 'player2';
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Target loser bracket match is already full');
  END IF;
  
  -- Update target match with loser
  IF v_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = p_loser_id,
        updated_at = NOW()
    WHERE id = v_target_match.id;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_loser_id,
        updated_at = NOW()
    WHERE id = v_target_match.id;
  END IF;
  
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'loser_id', p_loser_id,
    'source_match', p_match_id,
    'target_match', v_target_match.id,
    'target_round', v_target_round,
    'target_branch', v_target_branch,
    'position', v_position,
    'updated_rows', v_updated_rows
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;