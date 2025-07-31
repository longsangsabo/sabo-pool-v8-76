-- COMPREHENSIVE DOUBLE ELIMINATION RESTRUCTURE V9
-- Implementing proper 4-stage structure with standardized logic

-- ==============================================
-- PHASE 1: New Bracket Generation Function V9
-- ==============================================

CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_v9(
  p_tournament_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_bracket_size INTEGER;
  v_total_matches INTEGER := 0;
  v_round_matches INTEGER;
  v_match_counter INTEGER := 1;
  v_current_round INTEGER;
  v_i INTEGER;
  v_j INTEGER;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;

  -- Get confirmed participants
  SELECT array_agg(user_id ORDER BY registration_date) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed'
    AND payment_status = 'paid';

  v_participant_count := array_length(v_participants, 1);
  IF v_participant_count < 4 THEN
    RETURN jsonb_build_object('error', 'Need at least 4 participants');
  END IF;

  -- Calculate bracket size (power of 2)
  v_bracket_size := 2;
  WHILE v_bracket_size < v_participant_count LOOP
    v_bracket_size := v_bracket_size * 2;
  END LOOP;

  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;

  -- ==============================================
  -- STAGE 1: WINNER'S BRACKET (Rounds 1-3)
  -- ==============================================
  
  -- Round 1: 16→8 (8 matches)
  v_current_round := 1;
  v_round_matches := v_bracket_size / 2;
  
  FOR v_i IN 1..v_round_matches LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number,
      bracket_type, branch_type, match_stage,
      player1_id, player2_id,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, v_current_round, v_i,
      'winners', NULL, 'winners_r1',
      CASE WHEN (v_i * 2 - 1) <= v_participant_count THEN v_participants[v_i * 2 - 1] ELSE NULL END,
      CASE WHEN (v_i * 2) <= v_participant_count THEN v_participants[v_i * 2] ELSE NULL END,
      'scheduled', NOW(), NOW()
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;

  -- Round 2: 8→4 (4 matches) 
  v_current_round := 2;
  v_round_matches := v_round_matches / 2;
  
  FOR v_i IN 1..v_round_matches LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number,
      bracket_type, branch_type, match_stage,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, v_current_round, v_i,
      'winners', NULL, 'winners_r2',
      'scheduled', NOW(), NOW()
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;

  -- Round 3: 4→2 (2 matches)
  v_current_round := 3;
  v_round_matches := v_round_matches / 2;
  
  FOR v_i IN 1..v_round_matches LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number,
      bracket_type, branch_type, match_stage,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, v_current_round, v_i,
      'winners', NULL, 'winners_r3',
      'scheduled', NOW(), NOW()
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;

  -- ==============================================
  -- STAGE 2: LOSER'S BRANCH A (Rounds 11-13)
  -- Receives losers from Winner's Round 1 only
  -- ==============================================
  
  -- Round 11 (A1): 8→4 (4 matches)
  v_current_round := 11;
  v_round_matches := (v_bracket_size / 2) / 2; -- Half of Round 1 losers
  
  FOR v_i IN 1..v_round_matches LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number,
      bracket_type, branch_type, loser_branch, match_stage,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, v_current_round, v_i,
      'losers', 'A', 'A', 'branch_a_r1',
      'scheduled', NOW(), NOW()
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;

  -- Round 12 (A2): 4→2 (2 matches)
  v_current_round := 12;
  v_round_matches := v_round_matches / 2;
  
  FOR v_i IN 1..v_round_matches LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number,
      bracket_type, branch_type, loser_branch, match_stage,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, v_current_round, v_i,
      'losers', 'A', 'A', 'branch_a_r2',
      'scheduled', NOW(), NOW()
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;

  -- Round 13 (A3): 2→1 (1 match)
  v_current_round := 13;
  v_round_matches := 1;
  
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number,
    bracket_type, branch_type, loser_branch, match_stage,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, v_current_round, 1,
    'losers', 'A', 'A', 'branch_a_r3',
    'scheduled', NOW(), NOW()
  );
  v_total_matches := v_total_matches + 1;

  -- ==============================================
  -- STAGE 3: LOSER'S BRANCH B (Rounds 21-22)
  -- Receives losers from Winner's Round 2
  -- ==============================================
  
  -- Round 21 (B1): 4→2 (2 matches)
  v_current_round := 21;
  v_round_matches := 2;
  
  FOR v_i IN 1..v_round_matches LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number,
      bracket_type, branch_type, loser_branch, match_stage,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, v_current_round, v_i,
      'losers', 'B', 'B', 'branch_b_r1',
      'scheduled', NOW(), NOW()
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;

  -- Round 22 (B2): 2→1 (1 match)
  v_current_round := 22;
  
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number,
    bracket_type, branch_type, loser_branch, match_stage,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, v_current_round, 1,
    'losers', 'B', 'B', 'branch_b_r2',
    'scheduled', NOW(), NOW()
  );
  v_total_matches := v_total_matches + 1;

  -- ==============================================
  -- STAGE 4: FINAL STAGES (Rounds 31-32)
  -- ==============================================
  
  -- Round 31: Semifinals (2 matches)
  -- Match 1: Winner A vs Winner B (from losers)
  -- Match 2: Winner WB R3 Match 1 vs Winner WB R3 Match 2
  v_current_round := 31;
  
  FOR v_i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number,
      bracket_type, branch_type, match_stage,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, v_current_round, v_i,
      'semifinals', NULL, 'semifinals',
      'scheduled', NOW(), NOW()
    );
    v_total_matches := v_total_matches + 1;
  END LOOP;

  -- Round 32: Final (1 match)
  v_current_round := 32;
  
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number,
    bracket_type, branch_type, match_stage,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, v_current_round, 1,
    'finals', NULL, 'finals',
    'scheduled', NOW(), NOW()
  );
  v_total_matches := v_total_matches + 1;

  -- Update tournament status
  UPDATE tournaments 
  SET status = 'ongoing', updated_at = NOW()
  WHERE id = p_tournament_id;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'total_matches', v_total_matches,
    'bracket_size', v_bracket_size,
    'participants', v_participant_count,
    'structure', jsonb_build_object(
      'winners_bracket', '3 rounds (16→8→4→2)',
      'branch_a', '3 rounds (8→4→2→1)',
      'branch_b', '2 rounds (4→2→1)', 
      'finals', '2 rounds (semifinals + final)'
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Bracket generation failed: %s', SQLERRM)
    );
END;
$function$;

-- ==============================================
-- PHASE 2: Standardized Advancement Logic V9
-- ==============================================

CREATE OR REPLACE FUNCTION public.advance_double_elimination_v9(
  p_match_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_match RECORD;
  v_tournament_id UUID;
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_match_id UUID;
  v_advancements INTEGER := 0;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;

  v_tournament_id := v_match.tournament_id;
  v_winner_id := v_match.winner_id;
  v_loser_id := CASE 
    WHEN v_match.player1_id = v_winner_id THEN v_match.player2_id 
    ELSE v_match.player1_id 
  END;

  -- ==============================================
  -- WINNER'S BRACKET ADVANCEMENT
  -- ==============================================
  IF v_match.bracket_type = 'winners' THEN
    
    -- Round 1 → Round 2 (Winners)
    IF v_match.round_number = 1 THEN
      -- Advance winner to next round
      SELECT id INTO v_next_match_id
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
        AND bracket_type = 'winners'
        AND round_number = 2
        AND match_number = CEIL(v_match.match_number::numeric / 2)
        AND (player1_id IS NULL OR player2_id IS NULL);
        
      IF v_next_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player1_id = COALESCE(player1_id, v_winner_id),
            player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE v_winner_id END,
            updated_at = NOW()
        WHERE id = v_next_match_id;
        v_advancements := v_advancements + 1;
      END IF;

      -- Send loser to Branch A Round 11
      SELECT id INTO v_next_match_id
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
        AND bracket_type = 'losers'
        AND round_number = 11
        AND branch_type = 'A'
        AND match_number = CEIL(v_match.match_number::numeric / 2)
        AND (player1_id IS NULL OR player2_id IS NULL);
        
      IF v_next_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player1_id = COALESCE(player1_id, v_loser_id),
            player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE v_loser_id END,
            updated_at = NOW()
        WHERE id = v_next_match_id;
        v_advancements := v_advancements + 1;
      END IF;

    -- Round 2 → Round 3 (Winners)
    ELSIF v_match.round_number = 2 THEN
      -- Advance winner
      SELECT id INTO v_next_match_id
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
        AND bracket_type = 'winners'
        AND round_number = 3
        AND match_number = CEIL(v_match.match_number::numeric / 2);
        
      IF v_next_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player1_id = COALESCE(player1_id, v_winner_id),
            player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE v_winner_id END,
            updated_at = NOW()
        WHERE id = v_next_match_id;
        v_advancements := v_advancements + 1;
      END IF;

      -- Send loser to Branch B Round 21
      SELECT id INTO v_next_match_id
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
        AND bracket_type = 'losers'
        AND round_number = 21
        AND branch_type = 'B'
        AND match_number = CEIL(v_match.match_number::numeric / 2);
        
      IF v_next_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player1_id = COALESCE(player1_id, v_loser_id),
            player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE v_loser_id END,
            updated_at = NOW()
        WHERE id = v_next_match_id;
        v_advancements := v_advancements + 1;
      END IF;

    -- Round 3 → Semifinals
    ELSIF v_match.round_number = 3 THEN
      -- Advance winner to semifinals
      SELECT id INTO v_next_match_id
      FROM tournament_matches 
      WHERE tournament_id = v_tournament_id 
        AND bracket_type = 'semifinals'
        AND round_number = 31
        AND match_number = 2; -- Winners go to semifinal match 2
        
      IF v_next_match_id IS NOT NULL THEN
        UPDATE tournament_matches 
        SET player1_id = COALESCE(player1_id, v_winner_id),
            player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE v_winner_id END,
            updated_at = NOW()
        WHERE id = v_next_match_id;
        v_advancements := v_advancements + 1;
      END IF;
    END IF;

  -- ==============================================
  -- LOSER'S BRACKET ADVANCEMENT  
  -- ==============================================
  ELSIF v_match.bracket_type = 'losers' THEN
    
    -- Branch A progression (11→12→13)
    IF v_match.branch_type = 'A' THEN
      IF v_match.round_number = 11 THEN
        -- A1 → A2
        SELECT id INTO v_next_match_id
        FROM tournament_matches 
        WHERE tournament_id = v_tournament_id 
          AND bracket_type = 'losers'
          AND round_number = 12
          AND branch_type = 'A'
          AND match_number = CEIL(v_match.match_number::numeric / 2);
          
      ELSIF v_match.round_number = 12 THEN
        -- A2 → A3
        SELECT id INTO v_next_match_id
        FROM tournament_matches 
        WHERE tournament_id = v_tournament_id 
          AND bracket_type = 'losers'
          AND round_number = 13
          AND branch_type = 'A'
          AND match_number = 1;
          
      ELSIF v_match.round_number = 13 THEN
        -- A3 → Semifinals (match 1)
        SELECT id INTO v_next_match_id
        FROM tournament_matches 
        WHERE tournament_id = v_tournament_id 
          AND bracket_type = 'semifinals'
          AND round_number = 31
          AND match_number = 1;
      END IF;

    -- Branch B progression (21→22)
    ELSIF v_match.branch_type = 'B' THEN
      IF v_match.round_number = 21 THEN
        -- B1 → B2
        SELECT id INTO v_next_match_id
        FROM tournament_matches 
        WHERE tournament_id = v_tournament_id 
          AND bracket_type = 'losers'
          AND round_number = 22
          AND branch_type = 'B'
          AND match_number = 1;
          
      ELSIF v_match.round_number = 22 THEN
        -- B2 → Semifinals (match 1)
        SELECT id INTO v_next_match_id
        FROM tournament_matches 
        WHERE tournament_id = v_tournament_id 
          AND bracket_type = 'semifinals'
          AND round_number = 31
          AND match_number = 1;
      END IF;
    END IF;

    -- Advance winner in losers bracket
    IF v_next_match_id IS NOT NULL THEN
      UPDATE tournament_matches 
      SET player1_id = COALESCE(player1_id, v_winner_id),
          player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE v_winner_id END,
          updated_at = NOW()
      WHERE id = v_next_match_id;
      v_advancements := v_advancements + 1;
    END IF;

  -- ==============================================
  -- SEMIFINALS → FINAL
  -- ==============================================
  ELSIF v_match.bracket_type = 'semifinals' THEN
    SELECT id INTO v_next_match_id
    FROM tournament_matches 
    WHERE tournament_id = v_tournament_id 
      AND bracket_type = 'finals'
      AND round_number = 32;
      
    IF v_next_match_id IS NOT NULL THEN
      UPDATE tournament_matches 
      SET player1_id = COALESCE(player1_id, v_winner_id),
          player2_id = CASE WHEN player1_id IS NULL THEN player2_id ELSE v_winner_id END,
          updated_at = NOW()
      WHERE id = v_next_match_id;
      v_advancements := v_advancements + 1;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'advancements', v_advancements,
    'bracket_type', v_match.bracket_type,
    'round_number', v_match.round_number
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Advancement failed: %s', SQLERRM)
    );
END;
$function$;

-- ==============================================
-- PHASE 3: Repair Function V9
-- ==============================================

CREATE OR REPLACE FUNCTION public.repair_double_elimination_v9(
  p_tournament_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament RECORD;
  v_match RECORD;
  v_fixed_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;

  -- If tournament has old structure, regenerate with V9
  IF EXISTS (
    SELECT 1 FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND (round_number > 50 OR round_number < 1)
  ) THEN
    -- Clear and regenerate
    SELECT public.generate_double_elimination_bracket_v9(p_tournament_id) INTO v_result;
    
    IF v_result->>'success' = 'true' THEN
      RETURN jsonb_build_object(
        'success', true,
        'action', 'regenerated',
        'message', 'Tournament regenerated with V9 structure'
      );
    ELSE
      RETURN v_result;
    END IF;
  END IF;

  -- Fix completed matches that need advancement
  FOR v_match IN
    SELECT * FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND status = 'completed' 
      AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    -- Apply advancement logic
    SELECT public.advance_double_elimination_v9(v_match.id) INTO v_result;
    
    IF v_result->>'success' = 'true' THEN
      v_fixed_count := v_fixed_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'fixed_advancements', v_fixed_count,
    'tournament_id', p_tournament_id,
    'structure', 'V9 4-stage'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Repair failed: %s', SQLERRM)
    );
END;
$function$;

-- ==============================================
-- PHASE 4: Auto-advancement trigger
-- ==============================================

CREATE OR REPLACE FUNCTION public.trigger_advance_double_elimination_v9()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  -- Only process when match is completed with a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.status != 'completed' OR OLD.winner_id IS NULL) THEN
    
    -- Apply advancement logic
    SELECT public.advance_double_elimination_v9(NEW.id) INTO v_result;
    
    -- Log for debugging
    RAISE NOTICE 'Auto-advancement for match %: %', NEW.id, v_result;
  END IF;
  
  RETURN NEW;
END;
$function$;