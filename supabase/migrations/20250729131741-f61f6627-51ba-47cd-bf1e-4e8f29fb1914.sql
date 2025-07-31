-- Update advance_double_elimination_v9_fixed with improved logic
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
BEGIN
  RAISE NOTICE '🔄 Starting IMPROVED advance_double_elimination_v9_fixed for tournament: %', p_tournament_id;

  -- STEP 1: WINNERS BRACKET ADVANCEMENT
  RAISE NOTICE '🏆 Processing Winners Bracket advancements...';
  
  FOR v_completed_match IN
    SELECT tm.*, tm.winner_id, tm.round_number, tm.match_number
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.bracket_type = 'winners'
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
      AND NOT EXISTS (
        -- Check if winner is already advanced to next round
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

    -- ADVANCE WINNER TO NEXT WINNERS ROUND
    v_next_round := v_completed_match.round_number + 1;
    v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
    
    -- Check if next round exists
    SELECT player1_id, player2_id INTO v_current_players
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'winners'
      AND round_number = v_next_round
      AND match_number = v_next_match_number;

    IF FOUND THEN
      -- Determine position: odd matches go to player1, even matches go to player2
      IF v_completed_match.match_number % 2 = 1 THEN
        -- Odd match number → player1 position
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
        END IF;
      ELSE
        -- Even match number → player2 position
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
        END IF;
      END IF;
    END IF;

    -- MOVE LOSERS TO LOSERS BRACKET
    IF v_completed_match.round_number = 1 THEN
      -- R1 losers → Branch A (Round 11)
      v_next_round := 11;
      v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
      
    ELSIF v_completed_match.round_number = 2 THEN
      -- R2 losers → Branch B (Round 21)  
      v_next_round := 21;
      v_next_match_number := v_completed_match.match_number;
      
    ELSIF v_completed_match.round_number = 3 THEN
      -- R3 losers → Round 22 (after Branch A winners)
      v_next_round := 22;
      v_next_match_number := v_completed_match.match_number;
      
    ELSE
      -- Higher rounds → continue in losers bracket structure
      CONTINUE;
    END IF;

    -- Check if losers bracket slot exists and place loser
    SELECT player1_id, player2_id INTO v_current_players
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'losers'
      AND round_number = v_next_round
      AND match_number = v_next_match_number;

    IF FOUND THEN
      IF v_current_players.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'losers'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        RAISE NOTICE '✅ Moved loser %s to Losers R%s M%s player1', v_loser_id, v_next_round, v_next_match_number;
      ELSIF v_current_players.player2_id IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'losers'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        RAISE NOTICE '✅ Moved loser %s to Losers R%s M%s player2', v_loser_id, v_next_round, v_next_match_number;
      END IF;
    END IF;
  END LOOP;

  -- STEP 2: LOSERS BRACKET ADVANCEMENT
  RAISE NOTICE '🔄 Processing Losers Bracket advancements...';
  
  FOR v_completed_match IN
    SELECT tm.*, tm.winner_id, tm.round_number, tm.match_number
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.bracket_type = 'losers'
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
      AND NOT EXISTS (
        -- Check if winner already advanced to next losers round
        SELECT 1 FROM tournament_matches tm2
        WHERE tm2.tournament_id = p_tournament_id
          AND tm2.bracket_type = 'losers'
          AND tm2.round_number > tm.round_number
          AND (tm2.player1_id = tm.winner_id OR tm2.player2_id = tm.winner_id)
      )
    ORDER BY tm.round_number, tm.match_number
  LOOP
    v_winner_id := v_completed_match.winner_id;
    
    -- Determine next losers round based on current round
    IF v_completed_match.round_number = 11 THEN
      v_next_round := 12; -- Branch A winners → Round 12
    ELSIF v_completed_match.round_number = 12 THEN
      v_next_round := 13; -- Round 12 winners → Round 13
    ELSIF v_completed_match.round_number = 21 THEN
      v_next_round := 22; -- Branch B winners → Round 22
    ELSE
      -- Continue progression pattern
      v_next_round := v_completed_match.round_number + 1;
    END IF;
    
    v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
    
    -- Place winner in next losers round
    SELECT player1_id, player2_id INTO v_current_players
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'losers'
      AND round_number = v_next_round
      AND match_number = v_next_match_number;

    IF FOUND THEN
      IF v_completed_match.match_number % 2 = 1 AND v_current_players.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'losers'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        RAISE NOTICE '✅ Advanced losers winner %s to R%s M%s player1', v_winner_id, v_next_round, v_next_match_number;
        v_advancement_count := v_advancement_count + 1;
      ELSIF v_completed_match.match_number % 2 = 0 AND v_current_players.player2_id IS NULL THEN
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

  -- STEP 3: SEMIFINALS AND FINALS ADVANCEMENT
  -- Winners of Winners R3 → Semifinals
  FOR v_completed_match IN
    SELECT tm.*, tm.winner_id
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.bracket_type = 'winners'
      AND tm.round_number = 3
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
  LOOP
    -- Place winners bracket finalists in semifinals
    SELECT player1_id, player2_id INTO v_current_players
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'semifinals'
      AND round_number = 31
      AND match_number = 1;

    IF FOUND AND v_current_players.player1_id IS NULL THEN
      UPDATE tournament_matches 
      SET player1_id = v_completed_match.winner_id, updated_at = NOW()
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'semifinals'
        AND round_number = 31
        AND match_number = 1;
      
      RAISE NOTICE '✅ Advanced Winners finalist %s to Semifinals', v_completed_match.winner_id;
      v_advancement_count := v_advancement_count + 1;
    ELSIF FOUND AND v_current_players.player2_id IS NULL THEN
      UPDATE tournament_matches 
      SET player2_id = v_completed_match.winner_id, updated_at = NOW()
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'semifinals'
        AND round_number = 31
        AND match_number = 1;
      
      RAISE NOTICE '✅ Advanced Winners finalist %s to Semifinals', v_completed_match.winner_id;
      v_advancement_count := v_advancement_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Completed IMPROVED advance_double_elimination_v9_fixed: %s advancements', v_advancement_count;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'advancements_made', v_advancement_count,
    'errors', v_errors,
    'message', format('IMPROVED - Advanced %s players with corrected logic', v_advancement_count)
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error in IMPROVED advance_double_elimination_v9_fixed: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$function$;