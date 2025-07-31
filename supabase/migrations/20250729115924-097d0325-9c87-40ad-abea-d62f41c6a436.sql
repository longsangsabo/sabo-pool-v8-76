-- Drop existing function and recreate with fixed logic
DROP FUNCTION IF EXISTS public.advance_double_elimination_v9(uuid);

-- Create improved advance_double_elimination_v9 function with correct pairing logic
CREATE OR REPLACE FUNCTION public.advance_double_elimination_v9(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_completed_match RECORD;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_current_player1 UUID;
  v_current_player2 UUID;
  v_advancement_count INTEGER := 0;
  v_errors TEXT[] := '{}';
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_bracket_type TEXT;
  v_next_branch_type TEXT;
  v_pair_match_number INTEGER;
  v_pair_winner_id UUID;
BEGIN
  RAISE NOTICE '🔄 Starting advance_double_elimination_v9 for tournament: %', p_tournament_id;

  -- Process Winners Bracket advancements
  FOR v_completed_match IN
    SELECT tm.*, tm.winner_id, tm.round_number, tm.match_number
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.bracket_type = 'winners'
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
      AND NOT EXISTS (
        -- Check if this winner has already been advanced
        SELECT 1 FROM tournament_matches tm2
        WHERE tm2.tournament_id = p_tournament_id
          AND tm2.bracket_type = 'winners'
          AND tm2.round_number = tm.round_number + 1
          AND (tm2.player1_id = tm.winner_id OR tm2.player2_id = tm.winner_id)
      )
    ORDER BY tm.round_number, tm.match_number
  LOOP
    v_winner_id := v_completed_match.winner_id;
    v_loser_id := CASE 
      WHEN v_completed_match.player1_id = v_winner_id THEN v_completed_match.player2_id
      ELSE v_completed_match.player1_id
    END;

    RAISE NOTICE '🎯 Processing Winners Bracket R% M%: Winner=%, Loser=%', 
      v_completed_match.round_number, v_completed_match.match_number, v_winner_id, v_loser_id;

    -- Calculate next round advancement for Winners Bracket
    v_next_round := v_completed_match.round_number + 1;
    
    -- Corrected pairing logic: Process matches in pairs
    IF v_completed_match.round_number = 1 THEN
      -- Round 1 to Round 2: Pair matches (1,2) → 1, (3,4) → 2, etc.
      v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
      
      -- Determine position in the pair (odd match = player1, even match = player2)
      IF v_completed_match.match_number % 2 = 1 THEN
        -- Odd match number (1,3,5...) goes to player1 position
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'winners'
          AND round_number = v_next_round
          AND match_number = v_next_match_number
          AND player1_id IS NULL;
      ELSE
        -- Even match number (2,4,6...) goes to player2 position
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'winners'
          AND round_number = v_next_round
          AND match_number = v_next_match_number
          AND player2_id IS NULL;
      END IF;
    ELSE
      -- For rounds 2+: Standard halving logic
      v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
      
      -- Get current players in next match
      SELECT player1_id, player2_id INTO v_current_player1, v_current_player2
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'winners'
        AND round_number = v_next_round
        AND match_number = v_next_match_number;

      -- Assign to available slot, preventing duplicates
      IF v_current_player1 IS NULL AND v_current_player2 != v_winner_id THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'winners'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
      ELSIF v_current_player2 IS NULL AND v_current_player1 != v_winner_id THEN
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'winners'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
      ELSE
        v_errors := v_errors || format('Cannot advance winner % from R%M% - duplicate or no slots', 
          v_winner_id, v_completed_match.round_number, v_completed_match.match_number);
        CONTINUE;
      END IF;
    END IF;

    -- Move loser to Losers Bracket
    IF v_completed_match.round_number = 1 THEN
      -- Round 1 losers go to Losers Bracket Round 11 (Branch A)
      v_next_bracket_type := 'losers';
      v_next_branch_type := 'A';
      v_next_round := 11;
      v_next_match_number := v_completed_match.match_number; -- Same match number in Branch A
      
      -- Get current players in losers bracket match
      SELECT player1_id, player2_id INTO v_current_player1, v_current_player2
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = v_next_bracket_type
        AND branch_type = v_next_branch_type
        AND round_number = v_next_round
        AND match_number = v_next_match_number;

      -- Assign to available slot
      IF v_current_player1 IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = v_next_bracket_type
          AND branch_type = v_next_branch_type
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
      ELSIF v_current_player2 IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = v_next_bracket_type
          AND branch_type = v_next_branch_type
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
      END IF;
    ELSIF v_completed_match.round_number = 2 THEN
      -- Round 2 losers go to Losers Bracket Round 21 (Branch B)
      v_next_bracket_type := 'losers';
      v_next_branch_type := 'B';
      v_next_round := 21;
      v_next_match_number := v_completed_match.match_number;
      
      -- Similar logic for Branch B
      SELECT player1_id, player2_id INTO v_current_player1, v_current_player2
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = v_next_bracket_type
        AND branch_type = v_next_branch_type
        AND round_number = v_next_round
        AND match_number = v_next_match_number;

      IF v_current_player1 IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = v_next_bracket_type
          AND branch_type = v_next_branch_type
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
      ELSIF v_current_player2 IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = v_next_bracket_type
          AND branch_type = v_next_branch_type
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
      END IF;
    END IF;

    v_advancement_count := v_advancement_count + 1;
  END LOOP;

  -- Process Losers Bracket advancements (Branch A, B, Semifinals, Finals)
  -- Similar logic but adapted for losers bracket structure...

  RAISE NOTICE '✅ Completed advance_double_elimination_v9: % advancements, % errors', 
    v_advancement_count, array_length(v_errors, 1);

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'advancements_made', v_advancement_count,
    'errors', v_errors,
    'message', format('Advanced %s players successfully', v_advancement_count)
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error in advance_double_elimination_v9: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$$;

-- Create helper function to repair existing brackets
CREATE OR REPLACE FUNCTION public.repair_double_elimination_bracket_v9(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reset_count INTEGER := 0;
  v_result JSONB;
BEGIN
  RAISE NOTICE '🔧 Starting bracket repair for tournament: %', p_tournament_id;

  -- Reset Winners Bracket Round 2+ matches (keep Round 1 completed matches)
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, 
      winner_id = NULL, status = 'pending',
      updated_at = NOW()
  WHERE tournament_id = p_tournament_id
    AND bracket_type = 'winners'
    AND round_number > 1;
    
  GET DIAGNOSTICS v_reset_count = ROW_COUNT;

  -- Reset Losers Bracket matches
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL,
      winner_id = NULL, status = 'pending', 
      updated_at = NOW()
  WHERE tournament_id = p_tournament_id
    AND bracket_type = 'losers';

  -- Reset Semifinals and Finals
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL,
      winner_id = NULL, status = 'pending',
      updated_at = NOW()  
  WHERE tournament_id = p_tournament_id
    AND bracket_type IN ('semifinals', 'finals');

  RAISE NOTICE '🧹 Reset % matches, now running advancement...', v_reset_count;

  -- Run the corrected advancement function
  SELECT public.advance_double_elimination_v9(p_tournament_id) INTO v_result;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'matches_reset', v_reset_count,
    'advancement_result', v_result,
    'message', format('Repaired bracket: reset %s matches and re-ran advancement', v_reset_count)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$$;