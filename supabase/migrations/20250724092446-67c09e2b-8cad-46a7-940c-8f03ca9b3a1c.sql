-- Fix duplicate loser branch issues in double elimination tournaments

-- 1. Updated create_double_elimination_bracket_simplified function
CREATE OR REPLACE FUNCTION public.create_double_elimination_bracket_simplified(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_participants UUID[];
  v_participant_count INTEGER;
  v_bracket_size INTEGER;
  v_winners_rounds INTEGER;
  v_losers_rounds INTEGER;
  v_match_counter INTEGER := 1;
  v_round INTEGER;
  v_match INTEGER;
  v_result JSONB;
BEGIN
  -- Get confirmed participants
  SELECT array_agg(user_id ORDER BY registration_date)
  INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed';
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count IS NULL OR v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants for double elimination');
  END IF;
  
  -- Calculate bracket size (next power of 2)
  v_bracket_size := 2;
  WHILE v_bracket_size < v_participant_count LOOP
    v_bracket_size := v_bracket_size * 2;
  END LOOP;
  
  v_winners_rounds := CASE 
    WHEN v_bracket_size <= 2 THEN 1
    ELSE FLOOR(LOG(2, v_bracket_size))::INTEGER
  END;
  
  v_losers_rounds := (v_winners_rounds - 1) * 2;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Create Winners Bracket matches
  FOR v_round IN 1..v_winners_rounds LOOP
    DECLARE
      v_matches_in_round INTEGER := v_bracket_size / (2 ^ v_round);
    BEGIN
      FOR v_match IN 1..v_matches_in_round LOOP
        IF v_round = 1 THEN
          -- First round: assign participants
          DECLARE
            v_player1_idx INTEGER := (v_match - 1) * 2 + 1;
            v_player2_idx INTEGER := (v_match - 1) * 2 + 2;
          BEGIN
            INSERT INTO tournament_matches (
              tournament_id, round_number, match_number, 
              player1_id, player2_id, status, bracket_type
            ) VALUES (
              p_tournament_id, v_round, v_match,
              CASE WHEN v_player1_idx <= v_participant_count THEN v_participants[v_player1_idx] ELSE NULL END,
              CASE WHEN v_player2_idx <= v_participant_count THEN v_participants[v_player2_idx] ELSE NULL END,
              'pending', 'winners'
            );
          END;
        ELSE
          -- Later rounds: placeholder matches
          INSERT INTO tournament_matches (
            tournament_id, round_number, match_number, 
            player1_id, player2_id, status, bracket_type
          ) VALUES (
            p_tournament_id, v_round, v_match,
            NULL, NULL, 'pending', 'winners'
          );
        END IF;
      END LOOP;
    END;
  END LOOP;
  
  -- Create Loser's Bracket PLACEHOLDER matches only
  -- Branch A: receives losers from Winners R1, R3, R5...
  -- Branch B: receives losers from Winners R2, R4, R6...
  
  DECLARE
    v_branch_a_rounds INTEGER := (v_winners_rounds + 1) / 2;
    v_branch_b_rounds INTEGER := v_winners_rounds / 2;
  BEGIN
    -- Loser's Branch A (for losers from odd winner rounds)
    FOR v_round IN 1..v_branch_a_rounds LOOP
      DECLARE
        v_matches_in_round INTEGER := CASE 
          WHEN v_round = 1 THEN v_bracket_size / 4
          ELSE (v_bracket_size / 4) / (2 ^ (v_round - 1))
        END;
      BEGIN
        FOR v_match IN 1..v_matches_in_round LOOP
          INSERT INTO tournament_matches (
            tournament_id, round_number, match_number,
            player1_id, player2_id, status, bracket_type, branch_type
          ) VALUES (
            p_tournament_id, v_round, v_match,
            NULL, NULL, 'pending', 'losers', 'branch_a'
          );
        END LOOP;
      END;
    END LOOP;
    
    -- Loser's Branch B (for losers from even winner rounds)  
    FOR v_round IN 1..v_branch_b_rounds LOOP
      DECLARE
        v_matches_in_round INTEGER := CASE 
          WHEN v_round = 1 THEN v_bracket_size / 8
          ELSE (v_bracket_size / 8) / (2 ^ (v_round - 1))
        END;
      BEGIN
        FOR v_match IN 1..v_matches_in_round LOOP
          INSERT INTO tournament_matches (
            tournament_id, round_number, match_number,
            player1_id, player2_id, status, bracket_type, branch_type
          ) VALUES (
            p_tournament_id, v_round, v_match,
            NULL, NULL, 'pending', 'losers', 'branch_b'
          );
        END LOOP;
      END;
    END LOOP;
  END;
  
  -- Create Grand Final
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number,
    player1_id, player2_id, status, bracket_type
  ) VALUES (
    p_tournament_id, v_winners_rounds + v_losers_rounds + 1, 1,
    NULL, NULL, 'pending', 'grand_final'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'bracket_size', v_bracket_size,
    'winners_rounds', v_winners_rounds,
    'losers_rounds', v_losers_rounds,
    'total_matches', (
      SELECT COUNT(*) FROM tournament_matches 
      WHERE tournament_id = p_tournament_id
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- 2. Updated advance_simplified_double_elimination function
CREATE OR REPLACE FUNCTION public.advance_simplified_double_elimination(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_tournament_id UUID;
  v_next_winner_match RECORD;
  v_next_loser_match RECORD;
  v_advancement_result JSONB := jsonb_build_object();
BEGIN
  -- Get match details
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id AND status = 'completed' AND winner_id IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found, not completed, or no winner set');
  END IF;
  
  v_winner_id := v_match.winner_id;
  v_loser_id := CASE 
    WHEN v_match.player1_id = v_winner_id THEN v_match.player2_id 
    ELSE v_match.player1_id 
  END;
  v_tournament_id := v_match.tournament_id;
  
  -- Advance winner in winners bracket or to grand final
  IF v_match.bracket_type IN ('winners', 'grand_final') THEN
    IF v_match.bracket_type = 'winners' THEN
      -- Find next winners bracket match
      SELECT * INTO v_next_winner_match
      FROM tournament_matches
      WHERE tournament_id = v_tournament_id
      AND bracket_type = 'winners'
      AND round_number = v_match.round_number + 1
      AND match_number = CEIL(v_match.match_number / 2.0)
      LIMIT 1;
      
      IF FOUND THEN
        -- Advance winner to next winners match
        IF v_next_winner_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_winner_id, updated_at = NOW()
          WHERE id = v_next_winner_match.id;
          
          v_advancement_result := v_advancement_result || 
            jsonb_build_object('winner_advanced_to', 'winners_r' || (v_match.round_number + 1));
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_winner_id, updated_at = NOW()
          WHERE id = v_next_winner_match.id;
          
          v_advancement_result := v_advancement_result || 
            jsonb_build_object('winner_advanced_to', 'winners_r' || (v_match.round_number + 1));
        END IF;
      ELSE
        -- No next winners match, advance to grand final
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE tournament_id = v_tournament_id 
        AND bracket_type = 'grand_final'
        AND player1_id IS NULL;
        
        v_advancement_result := v_advancement_result || 
          jsonb_build_object('winner_advanced_to', 'grand_final');
      END IF;
    END IF;
    
    -- Place loser in appropriate loser bracket
    IF v_loser_id IS NOT NULL AND v_match.bracket_type = 'winners' THEN
      DECLARE
        v_target_branch TEXT;
        v_target_round INTEGER;
      BEGIN
        -- Determine which loser branch based on winners round
        IF v_match.round_number % 2 = 1 THEN
          -- Odd rounds go to Branch A
          v_target_branch := 'branch_a';
          v_target_round := (v_match.round_number + 1) / 2;
        ELSE
          -- Even rounds go to Branch B  
          v_target_branch := 'branch_b';
          v_target_round := v_match.round_number / 2;
        END IF;
        
        -- Find appropriate loser match
        SELECT * INTO v_next_loser_match
        FROM tournament_matches
        WHERE tournament_id = v_tournament_id
        AND bracket_type = 'losers'
        AND branch_type = v_target_branch
        AND round_number = v_target_round
        AND (player1_id IS NULL OR player2_id IS NULL)
        ORDER BY match_number
        LIMIT 1;
        
        IF FOUND THEN
          IF v_next_loser_match.player1_id IS NULL THEN
            UPDATE tournament_matches 
            SET player1_id = v_loser_id, updated_at = NOW()
            WHERE id = v_next_loser_match.id;
          ELSE
            UPDATE tournament_matches 
            SET player2_id = v_loser_id, updated_at = NOW()
            WHERE id = v_next_loser_match.id;
          END IF;
          
          v_advancement_result := v_advancement_result || 
            jsonb_build_object('loser_placed_in', v_target_branch || '_r' || v_target_round);
        END IF;
      END;
    END IF;
  END IF;
  
  -- Handle loser bracket advancement
  IF v_match.bracket_type = 'losers' THEN
    -- Find next loser match or grand final
    SELECT * INTO v_next_loser_match
    FROM tournament_matches
    WHERE tournament_id = v_tournament_id
    AND bracket_type = 'losers'
    AND round_number = v_match.round_number + 1
    AND branch_type = v_match.branch_type
    AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF FOUND THEN
      -- Advance to next loser round
      IF v_next_loser_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_loser_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_loser_match.id;
      END IF;
      
      v_advancement_result := v_advancement_result || 
        jsonb_build_object('winner_advanced_to', 'losers_r' || (v_match.round_number + 1));
    ELSE
      -- Advance to grand final as challenger
      UPDATE tournament_matches 
      SET player2_id = v_winner_id, updated_at = NOW()
      WHERE tournament_id = v_tournament_id 
      AND bracket_type = 'grand_final'
      AND player2_id IS NULL;
      
      v_advancement_result := v_advancement_result || 
        jsonb_build_object('winner_advanced_to', 'grand_final_challenger');
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'tournament_id', v_tournament_id,
    'bracket_type', v_match.bracket_type,
    'branch_type', v_match.branch_type,
    'round_number', v_match.round_number,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'advancements', v_advancement_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM, 'match_id', p_match_id);
END;
$$;

-- 3. Function to fix duplicate loser matches for tournament giai4
CREATE OR REPLACE FUNCTION public.fix_duplicate_loser_matches(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_fixed_count INTEGER := 0;
  v_removed_count INTEGER := 0;
BEGIN
  -- Remove all loser bracket matches (they have duplicates)
  DELETE FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND bracket_type = 'losers';
  
  GET DIAGNOSTICS v_removed_count = ROW_COUNT;
  
  -- Remove grand final to recreate it properly
  DELETE FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND bracket_type = 'grand_final';
  
  -- Recreate proper loser brackets and grand final using the fixed function
  DECLARE
    v_bracket_result JSONB;
  BEGIN
    -- Get number of participants to calculate proper bracket structure
    DECLARE
      v_participant_count INTEGER;
      v_bracket_size INTEGER;
      v_winners_rounds INTEGER;
      v_losers_rounds INTEGER;
    BEGIN
      SELECT COUNT(*) INTO v_participant_count
      FROM tournament_registrations 
      WHERE tournament_id = p_tournament_id 
      AND registration_status = 'confirmed';
      
      -- Calculate bracket size (next power of 2)
      v_bracket_size := 2;
      WHILE v_bracket_size < v_participant_count LOOP
        v_bracket_size := v_bracket_size * 2;
      END LOOP;
      
      v_winners_rounds := FLOOR(LOG(2, v_bracket_size))::INTEGER;
      v_losers_rounds := (v_winners_rounds - 1) * 2;
      
      -- Create Loser's Branch A placeholder matches
      FOR v_round IN 1..((v_winners_rounds + 1) / 2) LOOP
        DECLARE
          v_matches_in_round INTEGER := CASE 
            WHEN v_round = 1 THEN v_bracket_size / 4
            ELSE (v_bracket_size / 4) / (2 ^ (v_round - 1))
          END;
        BEGIN
          FOR v_match IN 1..v_matches_in_round LOOP
            INSERT INTO tournament_matches (
              tournament_id, round_number, match_number,
              player1_id, player2_id, status, bracket_type, branch_type
            ) VALUES (
              p_tournament_id, v_round, v_match,
              NULL, NULL, 'pending', 'losers', 'branch_a'
            );
            v_fixed_count := v_fixed_count + 1;
          END LOOP;
        END;
      END LOOP;
      
      -- Create Loser's Branch B placeholder matches
      FOR v_round IN 1..(v_winners_rounds / 2) LOOP
        DECLARE
          v_matches_in_round INTEGER := CASE 
            WHEN v_round = 1 THEN v_bracket_size / 8
            ELSE (v_bracket_size / 8) / (2 ^ (v_round - 1))
          END;
        BEGIN
          FOR v_match IN 1..v_matches_in_round LOOP
            INSERT INTO tournament_matches (
              tournament_id, round_number, match_number,
              player1_id, player2_id, status, bracket_type, branch_type
            ) VALUES (
              p_tournament_id, v_round, v_match,
              NULL, NULL, 'pending', 'losers', 'branch_b'
            );
            v_fixed_count := v_fixed_count + 1;
          END LOOP;
        END;
      END LOOP;
      
      -- Create Grand Final
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number,
        player1_id, player2_id, status, bracket_type
      ) VALUES (
        p_tournament_id, v_winners_rounds + v_losers_rounds + 1, 1,
        NULL, NULL, 'pending', 'grand_final'
      );
      v_fixed_count := v_fixed_count + 1;
    END;
  END;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'removed_matches', v_removed_count,
    'created_matches', v_fixed_count,
    'message', 'Duplicate loser matches fixed, placeholder matches created'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$$;

-- 4. Test function to validate the fix
CREATE OR REPLACE FUNCTION public.test_fixed_double_elimination()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament_id UUID;
  v_fix_result JSONB;
  v_validation_result JSONB;
BEGIN
  -- Find giai4 tournament
  SELECT id INTO v_tournament_id 
  FROM tournaments 
  WHERE name ILIKE '%giai4%'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_tournament_id IS NULL THEN
    RETURN jsonb_build_object('error', 'giai4 tournament not found');
  END IF;
  
  -- Fix the duplicate matches
  SELECT public.fix_duplicate_loser_matches(v_tournament_id) INTO v_fix_result;
  
  -- Validate results
  SELECT jsonb_build_object(
    'tournament_id', v_tournament_id,
    'total_matches', COUNT(*),
    'winners_matches', COUNT(*) FILTER (WHERE bracket_type = 'winners'),
    'losers_branch_a', COUNT(*) FILTER (WHERE bracket_type = 'losers' AND branch_type = 'branch_a'),
    'losers_branch_b', COUNT(*) FILTER (WHERE bracket_type = 'losers' AND branch_type = 'branch_b'),
    'grand_final', COUNT(*) FILTER (WHERE bracket_type = 'grand_final'),
    'duplicate_check', (
      SELECT COUNT(*) FROM (
        SELECT player1_id, player2_id, bracket_type, branch_type
        FROM tournament_matches 
        WHERE tournament_id = v_tournament_id 
        AND bracket_type = 'losers'
        AND player1_id IS NOT NULL 
        AND player2_id IS NOT NULL
        GROUP BY player1_id, player2_id, bracket_type, branch_type
        HAVING COUNT(*) > 1
      ) duplicates
    )
  ) INTO v_validation_result
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id;
  
  RETURN jsonb_build_object(
    'fix_result', v_fix_result,
    'validation', v_validation_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;