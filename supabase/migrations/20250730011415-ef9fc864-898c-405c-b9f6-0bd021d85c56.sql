-- Update advance_double_elimination_v9_fixed to use SABO structure
CREATE OR REPLACE FUNCTION public.advance_double_elimination_v9_fixed(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
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
  RAISE NOTICE '🔄 Starting SABO Double Elimination advancement for tournament: %', p_tournament_id;

  -- STEP 1: WINNERS BRACKET ADVANCEMENT (SABO: Rounds 1-3, NO Round 4)
  RAISE NOTICE '🏆 Processing Winners Bracket advancements (SABO: R1-R3)...';
  
  FOR v_completed_match IN
    SELECT tm.*, tm.winner_id, tm.round_number, tm.match_number
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.bracket_type = 'winners'
      AND tm.round_number IN (1, 2, 3) -- SABO: Only 3 rounds in winners
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM tournament_matches tm2
        WHERE tm2.tournament_id = p_tournament_id
          AND tm2.bracket_type IN ('winners', 'semifinals')
          AND ((tm.round_number < 3 AND tm2.round_number = tm.round_number + 1) OR
               (tm.round_number = 3 AND tm2.round_number = 250))
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

    -- ADVANCE WINNER TO NEXT ROUND
    IF v_completed_match.round_number = 1 THEN
      v_next_round := 2; -- R1 → R2
    ELSIF v_completed_match.round_number = 2 THEN  
      v_next_round := 3; -- R2 → R3
    ELSIF v_completed_match.round_number = 3 THEN
      v_next_round := 250; -- R3 → Semifinal (SABO: Winners stop at R3)
    ELSE
      CONTINUE;
    END IF;

    -- Calculate next match number and position
    IF v_next_round = 250 THEN
      -- Winners R3 → Semifinal (special case)
      v_next_match_number := v_completed_match.match_number; -- Match 1 or 2
      
      SELECT player1_id, player2_id INTO v_current_players
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'semifinals'
        AND round_number = 250
        AND match_number = v_next_match_number;

      IF FOUND AND v_current_players.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'semifinals'
          AND round_number = 250
          AND match_number = v_next_match_number;
        
        GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
        IF v_updated_rows > 0 THEN
          RAISE NOTICE '✅ Advanced winner to Semifinals R% M% player1', v_next_round, v_next_match_number;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      END IF;
    ELSE
      -- Regular winners bracket advancement
      v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
      
      SELECT player1_id, player2_id INTO v_current_players
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'winners'
        AND round_number = v_next_round
        AND match_number = v_next_match_number;

      IF FOUND THEN
        IF v_completed_match.match_number % 2 = 1 THEN
          -- Odd match → player1 position
          IF v_current_players.player1_id IS NULL THEN
            UPDATE tournament_matches 
            SET player1_id = v_winner_id, updated_at = NOW()
            WHERE tournament_id = p_tournament_id
              AND bracket_type = 'winners'
              AND round_number = v_next_round
              AND match_number = v_next_match_number;
            
            GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
            IF v_updated_rows > 0 THEN
              RAISE NOTICE '✅ Advanced winner to Winners R%s M%s player1', v_next_round, v_next_match_number;
              v_advancement_count := v_advancement_count + 1;
            END IF;
          END IF;
        ELSE
          -- Even match → player2 position  
          IF v_current_players.player2_id IS NULL THEN
            UPDATE tournament_matches 
            SET player2_id = v_winner_id, updated_at = NOW()
            WHERE tournament_id = p_tournament_id
              AND bracket_type = 'winners'
              AND round_number = v_next_round
              AND match_number = v_next_match_number;
            
            GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
            IF v_updated_rows > 0 THEN
              RAISE NOTICE '✅ Advanced winner to Winners R%s M%s player2', v_next_round, v_next_match_number;
              v_advancement_count := v_advancement_count + 1;
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;

    -- MOVE LOSERS TO LOSERS BRACKET (SABO Structure)
    IF v_completed_match.round_number = 1 THEN
      -- R1 losers → Branch A (Round 101)
      v_next_round := 101;
      v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
      
    ELSIF v_completed_match.round_number = 2 THEN
      -- R2 losers → Branch B (Round 201)
      v_next_round := 201;
      v_next_match_number := v_completed_match.match_number;
      
    ELSIF v_completed_match.round_number = 3 THEN
      -- R3 losers eliminated (no more chances in SABO)
      RAISE NOTICE '❌ Winner R3 loser eliminated: %', v_loser_id;
      CONTINUE;
    ELSE
      CONTINUE;
    END IF;

    -- Place loser in losers bracket
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
        
        RAISE NOTICE '✅ Moved loser to Losers R%s M%s player1', v_next_round, v_next_match_number;
      ELSIF v_current_players.player2_id IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'losers'
          AND round_number = v_next_round
          AND match_number = v_next_match_number;
        
        RAISE NOTICE '✅ Moved loser to Losers R%s M%s player2', v_next_round, v_next_match_number;
      END IF;
    END IF;
  END LOOP;

  -- STEP 2: LOSERS BRACKET ADVANCEMENT (SABO: Branch A: 101-103, Branch B: 201-202)
  RAISE NOTICE '🔄 Processing Losers Bracket advancements (SABO structure)...';
  
  FOR v_completed_match IN
    SELECT tm.*, tm.winner_id, tm.round_number, tm.match_number
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.bracket_type = 'losers'
      AND tm.round_number IN (101, 102, 103, 201, 202) -- SABO losers rounds
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM tournament_matches tm2
        WHERE tm2.tournament_id = p_tournament_id
          AND tm2.bracket_type IN ('losers', 'semifinals')
          AND ((tm.round_number < 202 AND tm2.round_number > tm.round_number) OR
               (tm.round_number IN (103, 202) AND tm2.round_number = 250))
          AND (tm2.player1_id = tm.winner_id OR tm2.player2_id = tm.winner_id)
      )
    ORDER BY tm.round_number, tm.match_number
  LOOP
    v_winner_id := v_completed_match.winner_id;
    
    -- Determine next round based on SABO losers bracket structure
    IF v_completed_match.round_number = 101 THEN
      v_next_round := 102; -- Branch A R1 → Branch A R2
    ELSIF v_completed_match.round_number = 102 THEN
      v_next_round := 103; -- Branch A R2 → Branch A R3
    ELSIF v_completed_match.round_number = 103 THEN
      -- Branch A R3 winner → Semifinals
      v_next_round := 250;
    ELSIF v_completed_match.round_number = 201 THEN
      v_next_round := 202; -- Branch B R1 → Branch B R2
    ELSIF v_completed_match.round_number = 202 THEN
      -- Branch B R2 winner → Semifinals
      v_next_round := 250;
    ELSE
      CONTINUE;
    END IF;
    
    IF v_next_round = 250 THEN
      -- Advance to semifinals
      SELECT player1_id, player2_id INTO v_current_players
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'semifinals'
        AND round_number = 250
        AND match_number = CASE 
          WHEN v_completed_match.round_number = 103 THEN 1  -- Branch A winner to match 1
          WHEN v_completed_match.round_number = 202 THEN 2  -- Branch B winner to match 2
        END;

      IF FOUND THEN
        IF v_current_players.player2_id IS NULL THEN
          UPDATE tournament_matches 
          SET player2_id = v_winner_id, updated_at = NOW()
          WHERE tournament_id = p_tournament_id
            AND bracket_type = 'semifinals'
            AND round_number = 250
            AND match_number = CASE 
              WHEN v_completed_match.round_number = 103 THEN 1
              WHEN v_completed_match.round_number = 202 THEN 2
            END;
          
          RAISE NOTICE '✅ Advanced Losers winner to Semifinals player2';
          v_advancement_count := v_advancement_count + 1;
        END IF;
      END IF;
    ELSE
      -- Regular losers bracket advancement
      v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
      
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
          
          RAISE NOTICE '✅ Advanced losers winner to R%s M%s player1', v_next_round, v_next_match_number;
          v_advancement_count := v_advancement_count + 1;
        ELSIF v_completed_match.match_number % 2 = 0 AND v_current_players.player2_id IS NULL THEN
          UPDATE tournament_matches 
          SET player2_id = v_winner_id, updated_at = NOW()
          WHERE tournament_id = p_tournament_id
            AND bracket_type = 'losers'
            AND round_number = v_next_round
            AND match_number = v_next_match_number;
          
          RAISE NOTICE '✅ Advanced losers winner to R%s M%s player2', v_next_round, v_next_match_number;
          v_advancement_count := v_advancement_count + 1;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- STEP 3: SEMIFINALS TO FINALS ADVANCEMENT (SABO: 250 → 300)
  FOR v_completed_match IN
    SELECT tm.*, tm.winner_id
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.bracket_type = 'semifinals'
      AND tm.round_number = 250
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM tournament_matches tm2
        WHERE tm2.tournament_id = p_tournament_id
          AND tm2.bracket_type = 'finals'
          AND tm2.round_number = 300
          AND (tm2.player1_id = tm.winner_id OR tm2.player2_id = tm.winner_id)
      )
  LOOP
    SELECT player1_id, player2_id INTO v_current_players
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'finals'
      AND round_number = 300;

    IF FOUND THEN
      IF v_current_players.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_completed_match.winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'finals'
          AND round_number = 300;
        
        RAISE NOTICE '✅ Advanced Semifinal winner to Finals player1';
        v_advancement_count := v_advancement_count + 1;
      ELSIF v_current_players.player2_id IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_completed_match.winner_id, updated_at = NOW()
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'finals'
          AND round_number = 300;
        
        RAISE NOTICE '✅ Advanced Semifinal winner to Finals player2';
        v_advancement_count := v_advancement_count + 1;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Completed SABO Double Elimination advancement: %s advancements', v_advancement_count;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'advancements_made', v_advancement_count,
    'errors', v_errors,
    'structure', 'SABO',
    'total_matches_expected', 27,
    'message', format('SABO advancement completed - Advanced %s players', v_advancement_count)
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error in SABO advance_double_elimination_v9_fixed: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id,
      'structure', 'SABO'
    );
END;
$function$;