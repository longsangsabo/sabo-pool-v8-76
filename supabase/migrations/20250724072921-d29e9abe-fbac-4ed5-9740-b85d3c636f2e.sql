-- Fix the advance_double_elimination_loser function to properly pair losers from Winner Round 1
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
  v_winner_match_number INTEGER;
  v_loser_pair_number INTEGER;
  v_target_position TEXT;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Only process double elimination tournaments
  IF v_tournament.tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a double elimination tournament');
  END IF;
  
  -- Only process winner bracket matches
  IF v_match.bracket_type != 'winner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only winner bracket matches produce losers');
  END IF;
  
  -- Calculate target loser bracket position
  v_winner_match_number := v_match.match_number;
  
  IF v_match.round_number = 1 THEN
    -- For Winner Round 1: Pair adjacent matches
    -- Match 1,2 → Loser Branch A Match 1
    -- Match 3,4 → Loser Branch A Match 2  
    -- Match 5,6 → Loser Branch B Match 1
    -- Match 7,8 → Loser Branch B Match 2
    
    v_loser_pair_number := ((v_winner_match_number - 1) / 2) + 1;
    v_target_round := 1;
    
    -- Determine branch and match number
    IF v_loser_pair_number <= (SELECT COUNT(*) FROM tournament_matches 
                               WHERE tournament_id = v_match.tournament_id 
                               AND round_number = 1 AND bracket_type = 'winner') / 4 THEN
      v_target_branch := 'loser_a';
      v_target_match_number := v_loser_pair_number;
    ELSE
      v_target_branch := 'loser_b';
      v_target_match_number := v_loser_pair_number - (SELECT COUNT(*) FROM tournament_matches 
                                                      WHERE tournament_id = v_match.tournament_id 
                                                      AND round_number = 1 AND bracket_type = 'winner') / 4;
    END IF;
    
    -- Determine position based on match number (odd = player1, even = player2)
    v_target_position := CASE WHEN v_winner_match_number % 2 = 1 THEN 'player1' ELSE 'player2' END;
    
  ELSE
    -- For higher rounds: Direct mapping to next loser round
    v_target_round := (v_match.round_number - 1) * 2;
    v_target_match_number := v_winner_match_number;
    v_target_branch := 'loser';
    v_target_position := 'player1'; -- Default position for higher round losers
  END IF;
  
  -- Find target loser bracket match
  SELECT * INTO v_target_match 
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id
    AND bracket_type = v_target_branch
    AND round_number = v_target_round
    AND match_number = v_target_match_number;
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target loser match not found');
  END IF;
  
  -- Place loser in appropriate position
  IF v_target_position = 'player1' AND v_target_match.player1_id IS NULL THEN
    UPDATE tournament_matches 
    SET player1_id = p_loser_id, 
        status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
        updated_at = NOW()
    WHERE id = v_target_match.id;
  ELSIF v_target_position = 'player2' AND v_target_match.player2_id IS NULL THEN
    UPDATE tournament_matches 
    SET player2_id = p_loser_id,
        status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
        updated_at = NOW()
    WHERE id = v_target_match.id;
  ELSIF v_target_match.player1_id IS NULL THEN
    UPDATE tournament_matches 
    SET player1_id = p_loser_id,
        status = CASE WHEN player2_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
        updated_at = NOW()
    WHERE id = v_target_match.id;
  ELSIF v_target_match.player2_id IS NULL THEN
    UPDATE tournament_matches 
    SET player2_id = p_loser_id,
        status = CASE WHEN player1_id IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
        updated_at = NOW()
    WHERE id = v_target_match.id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Target loser match is already full');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'loser_id', p_loser_id,
    'target_match_id', v_target_match.id,
    'target_round', v_target_round,
    'target_match_number', v_target_match_number,
    'target_branch', v_target_branch,
    'position', v_target_position
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create function to fix existing Round 1 loser bracket pairing issues
CREATE OR REPLACE FUNCTION public.fix_loser_bracket_round_1_pairing(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_winner_match RECORD;
  v_loser_id UUID;
  v_fixed_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors TEXT[] := '{}';
BEGIN
  -- Clear existing loser bracket Round 1 assignments
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, status = 'pending', updated_at = NOW()
  WHERE tournament_id = p_tournament_id
    AND bracket_type IN ('loser_a', 'loser_b')
    AND round_number = 1;
  
  -- Reprocess all completed Winner Round 1 matches
  FOR v_winner_match IN
    SELECT * FROM tournament_matches 
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'winner'
      AND round_number = 1
      AND status = 'completed'
      AND winner_id IS NOT NULL
    ORDER BY match_number
  LOOP
    -- Determine loser
    v_loser_id := CASE 
      WHEN v_winner_match.player1_id = v_winner_match.winner_id THEN v_winner_match.player2_id
      ELSE v_winner_match.player1_id
    END;
    
    -- Advance the loser using corrected logic
    DECLARE
      v_result JSONB;
    BEGIN
      SELECT public.advance_double_elimination_loser(v_winner_match.id, v_loser_id) INTO v_result;
      
      IF (v_result->>'success')::boolean THEN
        v_fixed_count := v_fixed_count + 1;
      ELSE
        v_error_count := v_error_count + 1;
        v_errors := v_errors || (v_result->>'error');
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        v_errors := v_errors || SQLERRM;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', v_error_count = 0,
    'tournament_id', p_tournament_id,
    'fixed_losers', v_fixed_count,
    'errors', v_error_count,
    'error_details', v_errors,
    'message', format('Fixed %s loser advancements, %s errors', v_fixed_count, v_error_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update repair_double_elimination_bracket to include pairing fixes
CREATE OR REPLACE FUNCTION public.repair_double_elimination_bracket(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_winner_result JSONB;
  v_loser_result JSONB;
  v_pairing_result JSONB;
  v_total_fixed INTEGER := 0;
  v_total_scheduled INTEGER := 0;
BEGIN
  -- Step 1: Fix winner bracket progression
  SELECT public.fix_all_tournament_progression(p_tournament_id) INTO v_winner_result;
  
  -- Step 2: Fix loser bracket Round 1 pairing issues
  SELECT public.fix_loser_bracket_round_1_pairing(p_tournament_id) INTO v_pairing_result;
  
  -- Step 3: Reset and repair remaining loser bracket
  SELECT public.reset_and_repair_loser_bracket(p_tournament_id) INTO v_loser_result;
  
  -- Step 4: Schedule matches that have both players assigned
  UPDATE tournament_matches 
  SET status = 'scheduled', updated_at = NOW()
  WHERE tournament_id = p_tournament_id
    AND bracket_type IN ('loser', 'loser_a', 'loser_b')
    AND status = 'pending'
    AND player1_id IS NOT NULL 
    AND player2_id IS NOT NULL;
    
  GET DIAGNOSTICS v_total_scheduled = ROW_COUNT;
  
  -- Count total fixes
  v_total_fixed := COALESCE((v_winner_result->>'fixed_matches')::INTEGER, 0) + 
                   COALESCE((v_loser_result->>'successful_losers')::INTEGER, 0) +
                   COALESCE((v_pairing_result->>'fixed_losers')::INTEGER, 0);
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'winner_bracket_result', v_winner_result,
    'loser_bracket_result', v_loser_result,
    'pairing_fix_result', v_pairing_result,
    'matches_scheduled', v_total_scheduled,
    'total_fixes', v_total_fixed,
    'repair_summary', format('Fixed %s advancements, scheduled %s matches', v_total_fixed, v_total_scheduled),
    'repaired_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;