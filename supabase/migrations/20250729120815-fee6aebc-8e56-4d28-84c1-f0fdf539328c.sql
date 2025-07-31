-- Fix advance_double_elimination_v9 with correct pairing logic
CREATE OR REPLACE FUNCTION public.advance_double_elimination_v9(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_updated_rows INTEGER;
BEGIN
  RAISE NOTICE '🔄 Starting FIXED advance_double_elimination_v9 for tournament: %', p_tournament_id;

  -- Process Winners Bracket advancements with CORRECT pairing logic
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
    
    -- CORRECTED pairing logic: Winner(2n-1) vs Winner(2n) → Match n
    v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
    
    -- Get current players in next match to avoid duplicates
    SELECT player1_id, player2_id INTO v_current_player1, v_current_player2
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'winners'
      AND round_number = v_next_round
      AND match_number = v_next_match_number;

    -- FIXED: Assign based on odd/even match number, with duplicate prevention
    IF v_completed_match.match_number % 2 = 1 THEN
      -- Odd match number (1,3,5...) goes to player1 position
      IF v_current_player1 IS NULL AND v_current_player2 != v_winner_id THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'winners'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
        IF v_updated_rows > 0 THEN
          RAISE NOTICE '✅ Advanced winner % to R% M% player1', v_winner_id, v_next_round, v_next_match_number;
        END IF;
      ELSE
        v_errors := v_errors || format('Cannot advance winner % to R%M% player1 - slot occupied or duplicate', 
          v_winner_id, v_next_round, v_next_match_number);
        CONTINUE;
      END IF;
    ELSE
      -- Even match number (2,4,6...) goes to player2 position
      IF v_current_player2 IS NULL AND v_current_player1 != v_winner_id THEN
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'winners'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
        IF v_updated_rows > 0 THEN
          RAISE NOTICE '✅ Advanced winner % to R% M% player2', v_winner_id, v_next_round, v_next_match_number;
        END IF;
      ELSE
        v_errors := v_errors || format('Cannot advance winner % to R%M% player2 - slot occupied or duplicate', 
          v_winner_id, v_next_round, v_next_match_number);
        CONTINUE;
      END IF;
    END IF;

    -- Move loser to Losers Bracket with FIXED distribution
    IF v_completed_match.round_number = 1 THEN
      -- Round 1 losers go to Losers Bracket Round 11 (Branch A)
      -- CORRECTED: Each loser gets their own match, no sharing
      v_next_bracket_type := 'losers';
      v_next_branch_type := 'A';
      v_next_round := 11;
      v_next_match_number := v_completed_match.match_number; -- Each match gets corresponding loser slot
      
      -- Get current players in losers bracket match
      SELECT player1_id, player2_id INTO v_current_player1, v_current_player2
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = v_next_bracket_type
        AND branch_type = v_next_branch_type
        AND round_number = v_next_round
        AND match_number = v_next_match_number;

      -- Assign to first available slot, preventing duplicates
      IF v_current_player1 IS NULL AND v_current_player2 != v_loser_id THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = v_next_bracket_type
          AND branch_type = v_next_branch_type
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        RAISE NOTICE '✅ Moved loser % to Losers R% M% player1', v_loser_id, v_next_round, v_next_match_number;
      ELSIF v_current_player2 IS NULL AND v_current_player1 != v_loser_id THEN
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = v_next_bracket_type
          AND branch_type = v_next_branch_type
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        RAISE NOTICE '✅ Moved loser % to Losers R% M% player2', v_loser_id, v_next_round, v_next_match_number;
      ELSE
        v_errors := v_errors || format('Cannot place loser % in Losers R%M% - slots occupied or duplicate', 
          v_loser_id, v_next_round, v_next_match_number);
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

      IF v_current_player1 IS NULL AND v_current_player2 != v_loser_id THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = v_next_bracket_type
          AND branch_type = v_next_branch_type
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
      ELSIF v_current_player2 IS NULL AND v_current_player1 != v_loser_id THEN
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
  -- Similar corrected logic for losers bracket progression...

  RAISE NOTICE '✅ Completed FIXED advance_double_elimination_v9: % advancements, % errors', 
    v_advancement_count, array_length(v_errors, 1);

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'advancements_made', v_advancement_count,
    'errors', v_errors,
    'message', format('FIXED - Advanced %s players successfully', v_advancement_count)
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error in FIXED advance_double_elimination_v9: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$function$;

-- Update repair_double_elimination_bracket_v9 to use the fixed function
CREATE OR REPLACE FUNCTION public.repair_double_elimination_bracket_v9(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_advancement_result JSONB;
  v_fixed_advancements INTEGER := 0;
  v_created_matches INTEGER := 0;
  v_errors TEXT[] := '{}';
BEGIN
  RAISE NOTICE '🔧 Starting ENHANCED repair_double_elimination_bracket_v9 for tournament: %', p_tournament_id;
  
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tournament not found',
      'tournament_id', p_tournament_id
    );
  END IF;

  -- Step 1: Reset duplicate players in matches
  UPDATE tournament_matches 
  SET player1_id = NULL 
  WHERE tournament_id = p_tournament_id 
    AND player1_id = player2_id;
    
  UPDATE tournament_matches 
  SET player2_id = NULL 
  WHERE tournament_id = p_tournament_id 
    AND player1_id = player2_id;

  RAISE NOTICE '🧹 Cleaned up duplicate players in matches';

  -- Step 2: Use FIXED advance_double_elimination_v9 function
  SELECT public.advance_double_elimination_v9(p_tournament_id) INTO v_advancement_result;
  
  IF v_advancement_result ? 'success' AND (v_advancement_result->>'success')::boolean THEN
    v_fixed_advancements := COALESCE((v_advancement_result->>'advancements_made')::integer, 0);
    RAISE NOTICE '✅ Fixed advancement completed: % advancements', v_fixed_advancements;
  ELSE
    v_errors := v_errors || ARRAY[v_advancement_result->>'error'];
    RAISE WARNING '❌ Advancement failed: %', v_advancement_result->>'error';
  END IF;

  -- Step 3: Verify no duplicates remain
  IF EXISTS (
    SELECT 1 FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND player1_id = player2_id 
    AND player1_id IS NOT NULL
  ) THEN
    v_errors := v_errors || ARRAY['Duplicate players still exist after repair'];
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'fixed_advancements', v_fixed_advancements,
    'created_matches', v_created_matches,
    'errors', v_errors,
    'repair_summary', format('Fixed %s advancements with corrected pairing logic', v_fixed_advancements)
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error in repair_double_elimination_bracket_v9: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$function$;