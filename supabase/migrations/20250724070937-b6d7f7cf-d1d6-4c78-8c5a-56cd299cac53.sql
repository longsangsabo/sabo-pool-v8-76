-- Fix Double Elimination Loser Bracket Logic

-- 1. Fix advance_double_elimination_loser function with proper logic
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
      v_target_branch := 'A';
      v_target_match_number := v_match.match_number;
      
    WHEN 2 THEN
      -- Round 2 losers go to Loser Bracket Branch B Round 1
      v_target_round := 1;
      v_target_branch := 'B';
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
    RETURN jsonb_build_object('success', false, 'error', 'Target loser bracket match not found');
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

-- 2. Update comprehensive function to automatically call loser advancement
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner_comprehensive(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_winner_result JSONB;
  v_loser_result JSONB;
  v_loser_id UUID;
  v_total_advancements INTEGER := 0;
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
  
  -- Ensure match is completed with winner
  IF v_match.status != 'completed' OR v_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not completed or no winner set');
  END IF;
  
  -- Determine loser
  IF v_match.player1_id IS NOT NULL AND v_match.player2_id IS NOT NULL THEN
    v_loser_id := CASE 
      WHEN v_match.winner_id = v_match.player1_id THEN v_match.player2_id 
      ELSE v_match.player1_id 
    END;
  END IF;
  
  -- Advance winner using existing logic
  SELECT public.advance_winner_to_next_round_enhanced(p_match_id, false) INTO v_winner_result;
  
  IF (v_winner_result->>'success')::boolean THEN
    v_total_advancements := v_total_advancements + 1;
  END IF;
  
  -- Advance loser to loser bracket (only for winner bracket matches)
  IF v_match.bracket_type = 'winner' AND v_loser_id IS NOT NULL THEN
    SELECT public.advance_double_elimination_loser(p_match_id, v_loser_id) INTO v_loser_result;
    
    IF (v_loser_result->>'success')::boolean THEN
      v_total_advancements := v_total_advancements + 1;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'bracket_type', v_match.bracket_type,
    'branch_type', v_match.branch_type,
    'round_number', v_match.round_number,
    'advancements', v_total_advancements,
    'winner_advancement', v_winner_result,
    'loser_advancement', COALESCE(v_loser_result, jsonb_build_object('message', 'No loser advancement needed'))
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 3. Update repair function to handle both winner and loser advancement
CREATE OR REPLACE FUNCTION public.repair_double_elimination_bracket(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_match RECORD;
  v_winner_advancements INTEGER := 0;
  v_loser_advancements INTEGER := 0;
  v_created_matches INTEGER := 0;
  v_errors TEXT[] := '{}';
  v_result JSONB;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament
  FROM tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  IF v_tournament.tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a double elimination tournament');
  END IF;
  
  -- Process completed winner bracket matches for winner advancement
  FOR v_match IN
    SELECT * FROM tournament_matches 
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'winner'
      AND status = 'completed'
      AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    BEGIN
      -- Try to advance winner
      SELECT public.advance_winner_to_next_round_enhanced(v_match.id, true) INTO v_result;
      
      IF (v_result->>'success')::boolean THEN
        v_winner_advancements := v_winner_advancements + 1;
      END IF;
      
      -- Try to advance loser to loser bracket
      DECLARE
        v_loser_id UUID;
        v_loser_result JSONB;
      BEGIN
        v_loser_id := CASE 
          WHEN v_match.winner_id = v_match.player1_id THEN v_match.player2_id 
          ELSE v_match.player1_id 
        END;
        
        IF v_loser_id IS NOT NULL THEN
          SELECT public.advance_double_elimination_loser(v_match.id, v_loser_id) INTO v_loser_result;
          
          IF (v_loser_result->>'success')::boolean THEN
            v_loser_advancements := v_loser_advancements + 1;
          END IF;
        END IF;
      END;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || ('Match ' || v_match.id || ': ' || SQLERRM);
    END;
  END LOOP;
  
  -- Process completed loser bracket matches for winner advancement
  FOR v_match IN
    SELECT * FROM tournament_matches 
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'loser'
      AND status = 'completed'
      AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    BEGIN
      SELECT public.advance_winner_to_next_round_enhanced(v_match.id, true) INTO v_result;
      
      IF (v_result->>'success')::boolean THEN
        v_winner_advancements := v_winner_advancements + 1;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || ('Loser Match ' || v_match.id || ': ' || SQLERRM);
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'repair_summary', format('Fixed %s winner advancements and %s loser advancements with %s errors', 
                            v_winner_advancements, v_loser_advancements, array_length(v_errors, 1)),
    'fixed_advancements', v_winner_advancements + v_loser_advancements,
    'winner_advancements', v_winner_advancements,
    'loser_advancements', v_loser_advancements,
    'created_matches', v_created_matches,
    'errors', v_errors,
    'repaired_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;