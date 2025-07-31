-- Sửa lỗi format string trong advance_double_elimination_v9_fixed
CREATE OR REPLACE FUNCTION public.advance_double_elimination_v9_fixed(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_completed_match RECORD;
  v_advancement_count INTEGER := 0;
  v_errors TEXT[] := '{}';
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_current_players RECORD;
  v_updated_rows INTEGER;
  v_validation_result JSONB;
BEGIN
  RAISE NOTICE '🔄 Starting CORRECTED advance_double_elimination_v9_fixed for tournament: %', p_tournament_id;

  -- STEP 1: WINNERS BRACKET ADVANCEMENT (CORRECTED LOGIC)
  RAISE NOTICE '🏆 Processing Winners Bracket advancements...';
  
  FOR v_completed_match IN
    SELECT tm.*, tm.winner_id, tm.round_number, tm.match_number
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.bracket_type = 'winners'
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
      AND NOT EXISTS (
        -- Prevent re-processing already advanced winners
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

    RAISE NOTICE '🎯 Processing Winners R% M%: Winner=%, Loser=%', 
      v_completed_match.round_number, v_completed_match.match_number, v_winner_id, v_loser_id;

    -- CORRECTED WINNERS BRACKET PAIRING LOGIC
    v_next_round := v_completed_match.round_number + 1;
    
    -- FIXED: Winner(2n-1) vs Winner(2n) → Match n
    -- Match 1,2 → Match 1; Match 3,4 → Match 2; Match 5,6 → Match 3, etc.
    v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
    
    -- Get current players in the target next match
    SELECT player1_id, player2_id INTO v_current_players
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'winners'
      AND round_number = v_next_round
      AND match_number = v_next_match_number;

    -- Validation: Prevent duplicate player assignment
    IF v_current_players.player1_id = v_winner_id OR v_current_players.player2_id = v_winner_id THEN
      v_errors := v_errors || format('❌ DUPLICATE: Winner %s already in R%sM%s', 
        v_winner_id, v_next_round, v_next_match_number);
      CONTINUE;
    END IF;

    -- CORRECTED ASSIGNMENT LOGIC: Odd matches → player1, Even matches → player2
    IF v_completed_match.match_number % 2 = 1 THEN
      -- Odd match number (1,3,5...) → player1 position
      IF v_current_players.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'winners'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
        IF v_updated_rows > 0 THEN
          RAISE NOTICE '✅ Advanced winner %s to Winners R%s M%s player1', v_winner_id, v_next_round, v_next_match_number;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      ELSE
        v_errors := v_errors || format('❌ Cannot advance winner %s to R%sM%s player1 - slot occupied', 
          v_winner_id, v_next_round, v_next_match_number);
        CONTINUE;
      END IF;
    ELSE
      -- Even match number (2,4,6...) → player2 position
      IF v_current_players.player2_id IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'winners'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
        IF v_updated_rows > 0 THEN
          RAISE NOTICE '✅ Advanced winner %s to Winners R%s M%s player2', v_winner_id, v_next_round, v_next_match_number;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      ELSE
        v_errors := v_errors || format('❌ Cannot advance winner %s to R%sM%s player2 - slot occupied', 
          v_winner_id, v_next_round, v_next_match_number);
        CONTINUE;
      END IF;
    END IF;

    -- STEP 2: MOVE LOSERS TO CORRECT LOSERS BRACKET BRANCHES
    IF v_completed_match.round_number = 1 THEN
      -- Winners R1 losers → Losers Branch A (Round 11)
      -- CORRECTED: Loser M(2n-1) vs Loser M(2n) → Match n in Branch A
      v_next_round := 11;
      v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
      
      SELECT player1_id, player2_id INTO v_current_players
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'losers'
        AND round_number = v_next_round
        AND match_number = v_next_match_number;

      -- Assign loser to appropriate slot in Branch A
      IF v_completed_match.match_number % 2 = 1 THEN
        -- Odd match loser → player1
        IF v_current_players.player1_id IS NULL AND v_current_players.player2_id != v_loser_id THEN
          UPDATE tournament_matches 
          SET player1_id = v_loser_id, updated_at = NOW()
          WHERE tournament_id = p_tournament_id
            AND bracket_type = 'losers'
            AND round_number = v_next_round
            AND match_number = v_next_match_number;
          
          RAISE NOTICE '✅ Moved loser %s to Branch A R%s M%s player1', v_loser_id, v_next_round, v_next_match_number;
        END IF;
      ELSE
        -- Even match loser → player2
        IF v_current_players.player2_id IS NULL AND v_current_players.player1_id != v_loser_id THEN
          UPDATE tournament_matches 
          SET player2_id = v_loser_id, updated_at = NOW()
          WHERE tournament_id = p_tournament_id
            AND bracket_type = 'losers'
            AND round_number = v_next_round
            AND match_number = v_next_match_number;
          
          RAISE NOTICE '✅ Moved loser %s to Branch A R%s M%s player2', v_loser_id, v_next_round, v_next_match_number;
        END IF;
      END IF;
      
    ELSIF v_completed_match.round_number = 2 THEN
      -- Winners R2 losers → Losers Branch B (Round 21)
      v_next_round := 21;
      v_next_match_number := v_completed_match.match_number;
      
      SELECT player1_id, player2_id INTO v_current_players
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'losers'
        AND round_number = v_next_round
        AND match_number = v_next_match_number;

      -- Place loser in first available slot
      IF v_current_players.player1_id IS NULL AND v_current_players.player2_id != v_loser_id THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'losers'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        RAISE NOTICE '✅ Moved loser %s to Branch B R%s M%s player1', v_loser_id, v_next_round, v_next_match_number;
      ELSIF v_current_players.player2_id IS NULL AND v_current_players.player1_id != v_loser_id THEN
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'losers'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        RAISE NOTICE '✅ Moved loser %s to Branch B R%s M%s player2', v_loser_id, v_next_round, v_next_match_number;
      END IF;
    END IF;
  END LOOP;

  -- STEP 3: LOSERS BRACKET ADVANCEMENT (Branch A and B)
  RAISE NOTICE '🔄 Processing Losers Bracket advancements...';
  
  FOR v_completed_match IN
    SELECT tm.*, tm.winner_id, tm.round_number, tm.match_number
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.bracket_type = 'losers'
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
      AND NOT EXISTS (
        -- Prevent re-processing
        SELECT 1 FROM tournament_matches tm2
        WHERE tm2.tournament_id = p_tournament_id
          AND tm2.bracket_type = 'losers'
          AND tm2.round_number = tm.round_number + 1
          AND (tm2.player1_id = tm.winner_id OR tm2.player2_id = tm.winner_id)
      )
    ORDER BY tm.round_number, tm.match_number
  LOOP
    v_winner_id := v_completed_match.winner_id;
    v_next_round := v_completed_match.round_number + 1;
    v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
    
    -- Get current players in next losers round
    SELECT player1_id, player2_id INTO v_current_players
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'losers'
      AND round_number = v_next_round
      AND match_number = v_next_match_number;

    -- Advance winner in losers bracket
    IF v_completed_match.match_number % 2 = 1 THEN
      IF v_current_players.player1_id IS NULL AND v_current_players.player2_id != v_winner_id THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'losers'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        RAISE NOTICE '✅ Advanced losers winner %s to R%s M%s player1', v_winner_id, v_next_round, v_next_match_number;
        v_advancement_count := v_advancement_count + 1;
      END IF;
    ELSE
      IF v_current_players.player2_id IS NULL AND v_current_players.player1_id != v_winner_id THEN
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'losers'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        RAISE NOTICE '✅ Advanced losers winner %s to R%s M%s player2', v_winner_id, v_next_round, v_next_match_number;
        v_advancement_count := v_advancement_count + 1;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Completed CORRECTED advance_double_elimination_v9_fixed: %s advancements, %s errors', 
    v_advancement_count, array_length(v_errors, 1);

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'advancements_made', v_advancement_count,
    'errors', v_errors,
    'message', format('FIXED - Advanced %s players successfully with correct logic', v_advancement_count)
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error in CORRECTED advance_double_elimination_v9_fixed: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$function$;