-- Enhanced Double Elimination System based on double1 tournament logic
-- Standardize Round Number System and improve advancement logic

-- 1. Update advance_winner_to_next_round_enhanced function with precise logic from double1
CREATE OR REPLACE FUNCTION public.advance_winner_to_next_round_enhanced(
  p_match_id UUID,
  p_force_advance BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament_type TEXT;
  v_next_match RECORD;
  v_loser_match RECORD;
  v_result JSONB;
  v_loser_id UUID;
  v_grand_final_reset BOOLEAN := FALSE;
BEGIN
  -- Get current match details with all necessary fields
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Check if match has a winner (unless forced)
  IF v_match.winner_id IS NULL AND NOT p_force_advance THEN
    RETURN jsonb_build_object('error', 'Match has no winner');
  END IF;
  
  -- Get tournament type
  SELECT tournament_type INTO v_tournament_type
  FROM tournaments 
  WHERE id = v_match.tournament_id;
  
  IF v_tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('error', 'This function only supports double elimination tournaments');
  END IF;
  
  -- Determine loser
  v_loser_id := CASE 
    WHEN v_match.winner_id = v_match.player1_id THEN v_match.player2_id
    WHEN v_match.winner_id = v_match.player2_id THEN v_match.player1_id
    ELSE NULL
  END;
  
  -- Handle advancement based on standardized round numbers like double1
  CASE v_match.round_number
    -- WINNERS BRACKET (Rounds 1-4)
    WHEN 1, 2, 3 THEN
      -- Winners advance to next round
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'winners'
        AND round_number = v_match.round_number + 1
        AND match_number = CEIL(v_match.match_number::NUMERIC / 2)
      LIMIT 1;
      
      IF v_next_match.id IS NOT NULL THEN
        -- Determine position based on match number parity
        IF v_match.match_number % 2 = 1 THEN
          UPDATE tournament_matches 
          SET player1_id = v_match.winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_match.winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
        END IF;
      END IF;
      
      -- Handle losers based on round (precise placement like double1)
      CASE v_match.round_number
        WHEN 1 THEN
          -- WB R1 losers go to LBA R101
          IF v_match.match_number % 2 = 1 THEN
            UPDATE tournament_matches 
            SET player1_id = v_loser_id, updated_at = NOW()
            WHERE tournament_id = v_match.tournament_id
              AND round_number = 101
              AND match_number = CEIL(v_match.match_number::NUMERIC / 2);
          ELSE
            UPDATE tournament_matches 
            SET player2_id = v_loser_id, updated_at = NOW()
            WHERE tournament_id = v_match.tournament_id
              AND round_number = 101
              AND match_number = CEIL(v_match.match_number::NUMERIC / 2);
          END IF;
          
        WHEN 2 THEN
          -- WB R2 losers go to LBB R201
          UPDATE tournament_matches 
          SET player1_id = v_loser_id, updated_at = NOW()
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 201
            AND match_number = v_match.match_number;
            
        WHEN 3 THEN
          -- WB R3 loser goes to LBB R201 (specific placement)
          UPDATE tournament_matches 
          SET player2_id = v_loser_id, updated_at = NOW()
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 201
            AND match_number = 2;
      END CASE;
      
    WHEN 4 THEN
      -- Winners bracket final - winner goes to Grand Final
      UPDATE tournament_matches 
      SET player1_id = v_match.winner_id, updated_at = NOW()
      WHERE tournament_id = v_match.tournament_id
        AND round_number = 301
        AND match_number = 1;
      
      -- Loser goes to Semifinal (R250)
      UPDATE tournament_matches 
      SET player2_id = v_loser_id, updated_at = NOW()
      WHERE tournament_id = v_match.tournament_id
        AND round_number = 250
        AND match_number = 1;
    
    -- LOSERS BRACKET A (Rounds 101-103)
    WHEN 101, 102 THEN
      -- Advance within LBA
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND round_number = v_match.round_number + 1
        AND match_number = CEIL(v_match.match_number::NUMERIC / 2)
      LIMIT 1;
      
      IF v_next_match.id IS NOT NULL THEN
        IF v_match.match_number % 2 = 1 THEN
          UPDATE tournament_matches 
          SET player1_id = v_match.winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_match.winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
        END IF;
      END IF;
      
    WHEN 103 THEN
      -- LBA final - winner goes to LBB R201
      UPDATE tournament_matches 
      SET player2_id = v_match.winner_id, updated_at = NOW()
      WHERE tournament_id = v_match.tournament_id
        AND round_number = 201
        AND match_number = 1;
    
    -- LOSERS BRACKET B (Rounds 201-202)
    WHEN 201 THEN
      -- LBB matches advance to R202
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND round_number = 202
        AND match_number = 1
      LIMIT 1;
      
      IF v_next_match.id IS NOT NULL THEN
        IF v_match.match_number = 1 THEN
          UPDATE tournament_matches 
          SET player1_id = v_match.winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_match.winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
        END IF;
      END IF;
      
    WHEN 202 THEN
      -- LBB final - winner goes to Semifinal R250
      UPDATE tournament_matches 
      SET player1_id = v_match.winner_id, updated_at = NOW()
      WHERE tournament_id = v_match.tournament_id
        AND round_number = 250
        AND match_number = 1;
    
    -- SEMIFINAL (Round 250)
    WHEN 250 THEN
      -- Semifinal winner goes to Grand Final as player2
      UPDATE tournament_matches 
      SET player2_id = v_match.winner_id, updated_at = NOW()
      WHERE tournament_id = v_match.tournament_id
        AND round_number = 301
        AND match_number = 1;
    
    -- GRAND FINAL (Round 301)
    WHEN 301 THEN
      -- Check if losers bracket finalist (player2) won
      IF v_match.winner_id = v_match.player2_id THEN
        -- Reset grand final - create R302 match
        v_grand_final_reset := TRUE;
        UPDATE tournament_matches 
        SET player1_id = v_match.player1_id,
            player2_id = v_match.player2_id,
            status = 'scheduled',
            updated_at = NOW()
        WHERE tournament_id = v_match.tournament_id
          AND round_number = 302
          AND match_number = 1;
      ELSE
        -- Winners bracket champion wins tournament
        UPDATE tournaments 
        SET status = 'completed', 
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = v_match.tournament_id;
      END IF;
    
    -- GRAND FINAL RESET (Round 302)
    WHEN 302 THEN
      -- Tournament complete
      UPDATE tournaments 
      SET status = 'completed',
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = v_match.tournament_id;
      
    ELSE
      RETURN jsonb_build_object(
        'error', 
        'Unknown round number: ' || v_match.round_number
      );
  END CASE;
  
  -- Log advancement for debugging
  INSERT INTO tournament_automation_log (
    tournament_id,
    automation_type,
    status,
    details,
    completed_at
  ) VALUES (
    v_match.tournament_id,
    'auto_winner_advancement',
    'completed',
    jsonb_build_object(
      'match_id', p_match_id,
      'round_number', v_match.round_number,
      'match_number', v_match.match_number,
      'winner_id', v_match.winner_id,
      'grand_final_reset', v_grand_final_reset
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'round_number', v_match.round_number,
    'match_number', v_match.match_number,
    'winner_advanced', true,
    'grand_final_reset', v_grand_final_reset,
    'message', 'Winner successfully advanced using double1 logic'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'match_id', p_match_id
    );
END;
$$;

-- 2. Create enhanced double elimination bracket generation with standardized rounds
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete_v8(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_participant_count INTEGER;
  v_participants UUID[];
  v_winners_rounds INTEGER;
  v_match_id UUID;
  v_i INTEGER;
  v_j INTEGER;
  v_match_number INTEGER;
  v_round INTEGER;
BEGIN
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Get confirmed participants in registration order
  SELECT array_agg(user_id ORDER BY created_at), COUNT(*)
  INTO v_participants, v_participant_count
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed';
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants');
  END IF;
  
  -- Calculate winners bracket rounds needed
  v_winners_rounds := CEIL(LOG(2, v_participant_count));
  
  -- 1. CREATE WINNERS BRACKET (Rounds 1-4)
  v_match_number := 1;
  FOR v_round IN 1..v_winners_rounds LOOP
    DECLARE
      v_matches_in_round INTEGER;
    BEGIN
      v_matches_in_round := CEIL(v_participant_count / POWER(2, v_round));
      
      FOR v_i IN 1..v_matches_in_round LOOP
        INSERT INTO tournament_matches (
          id, tournament_id, round_number, match_number,
          bracket_type, match_stage, status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), p_tournament_id, v_round, v_i,
          'winners', 'winners_bracket', 'scheduled', NOW(), NOW()
        );
      END LOOP;
    END;
  END LOOP;
  
  -- 2. CREATE LOSERS BRACKET A (Rounds 101-103)
  -- LBA R101: Matches for WB R1 losers
  v_match_number := 1;
  FOR v_i IN 1..CEIL(v_participant_count / 4.0) LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number,
      bracket_type, match_stage, status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, 101, v_i,
      'losers', 'losers_branch_a', 'scheduled', NOW(), NOW()
    );
  END LOOP;
  
  -- LBA R102: Next round
  FOR v_i IN 1..CEIL(v_participant_count / 8.0) LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number,
      bracket_type, match_stage, status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, 102, v_i,
      'losers', 'losers_branch_a', 'scheduled', NOW(), NOW()
    );
  END LOOP;
  
  -- LBA R103: LBA Final
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number,
    bracket_type, match_stage, status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, 103, 1,
    'losers', 'losers_branch_a', 'scheduled', NOW(), NOW()
  );
  
  -- 3. CREATE LOSERS BRACKET B (Rounds 201-202)
  -- LBB R201: 2 matches (WB losers + LBA winner)
  FOR v_i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number,
      bracket_type, match_stage, status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, 201, v_i,
      'losers', 'losers_branch_b', 'scheduled', NOW(), NOW()
    );
  END LOOP;
  
  -- LBB R202: LBB Final
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number,
    bracket_type, match_stage, status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, 202, 1,
    'losers', 'losers_branch_b', 'scheduled', NOW(), NOW()
  );
  
  -- 4. CREATE SEMIFINAL (Round 250)
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number,
    bracket_type, match_stage, status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, 250, 1,
    'losers', 'semifinal', 'scheduled', NOW(), NOW()
  );
  
  -- 5. CREATE GRAND FINAL (Round 301)
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number,
    bracket_type, match_stage, status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, 301, 1,
    'final', 'grand_final', 'scheduled', NOW(), NOW()
  );
  
  -- 6. CREATE GRAND FINAL RESET (Round 302) 
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number,
    bracket_type, match_stage, status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, 302, 1,
    'final', 'grand_final_reset', 'scheduled', NOW(), NOW()
  );
  
  -- 7. SEED INITIAL WINNERS BRACKET MATCHES
  v_i := 1;
  FOR v_match_number IN 1..CEIL(v_participant_count / 2.0) LOOP
    IF v_i <= v_participant_count THEN
      UPDATE tournament_matches 
      SET player1_id = v_participants[v_i]
      WHERE tournament_id = p_tournament_id 
        AND round_number = 1 
        AND match_number = v_match_number;
    END IF;
    
    v_i := v_i + 1;
    IF v_i <= v_participant_count THEN
      UPDATE tournament_matches 
      SET player2_id = v_participants[v_i]
      WHERE tournament_id = p_tournament_id 
        AND round_number = 1 
        AND match_number = v_match_number;
    END IF;
    
    v_i := v_i + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'winners_rounds', v_winners_rounds,
    'bracket_structure', 'double_elimination_v8',
    'message', 'Double elimination bracket created with standardized round numbers'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 3. Create comprehensive tournament repair function based on double1 logic
CREATE OR REPLACE FUNCTION public.repair_double_elimination_bracket_v2(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_fixed_count INTEGER := 0;
  v_errors TEXT[] := '{}';
  v_advancement_result JSONB;
BEGIN
  -- Process all completed matches in correct order
  FOR v_match IN
    SELECT id, round_number, match_number, winner_id, bracket_type, match_stage
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND status = 'completed'
      AND winner_id IS NOT NULL
    ORDER BY 
      CASE 
        WHEN round_number BETWEEN 1 AND 4 THEN 1
        WHEN round_number BETWEEN 101 AND 103 THEN 2  
        WHEN round_number BETWEEN 201 AND 202 THEN 3
        WHEN round_number = 250 THEN 4
        WHEN round_number = 301 THEN 5
        WHEN round_number = 302 THEN 6
        ELSE 7
      END,
      round_number,
      match_number
  LOOP
    -- Use enhanced advancement function
    SELECT public.advance_winner_to_next_round_enhanced(v_match.id, TRUE) 
    INTO v_advancement_result;
    
    IF (v_advancement_result->>'success')::boolean THEN
      v_fixed_count := v_fixed_count + 1;
    ELSE
      v_errors := v_errors || (v_advancement_result->>'error');
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'tournament_id', p_tournament_id,
    'matches_processed', v_fixed_count,
    'errors', v_errors,
    'repair_type', 'double_elimination_v2',
    'message', format('Processed %s matches with %s errors', v_fixed_count, array_length(v_errors, 1))
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;