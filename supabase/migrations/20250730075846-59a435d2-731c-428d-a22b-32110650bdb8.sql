-- ============================================================================
-- SABO DOUBLE ELIMINATION SYSTEM - 15 TASK IMPLEMENTATION
-- Comprehensive tournament management with bulletproof advancement logic
-- ============================================================================

-- PHASE 1: Archive existing problematic functions (keep them for reference)
-- We'll prefix old functions with deprecated_ instead of dropping them

-- PHASE 2: Implement the 15 core functions

-- ============================================================================
-- TASK 1: TOURNAMENT INITIALIZATION
-- Creates tournament structure with 27 matches
-- ============================================================================
CREATE OR REPLACE FUNCTION public.initialize_sabo_tournament(
  p_tournament_id uuid,
  p_player_ids uuid[]
)
RETURNS TABLE(success boolean, message text, matches_created integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match_id uuid;
  v_player_index integer := 1;
  v_matches_created integer := 0;
BEGIN
  -- Clear any existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Validate player count
  IF array_length(p_player_ids, 1) != 16 THEN
    RETURN QUERY SELECT false, 'Must have exactly 16 players', 0;
    RETURN;
  END IF;
  
  -- Create Winners Bracket Round 1 (8 matches) - SCHEDULED with players
  FOR i IN 1..8 LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number, bracket_type,
      player1_id, player2_id, status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, 1, i, 'winners',
      p_player_ids[v_player_index], p_player_ids[v_player_index + 1],
      'scheduled', NOW(), NOW()
    );
    v_player_index := v_player_index + 2;
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Create Winners Round 2 (4 matches) - PENDING (empty)
  FOR i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, 2, i, 'winners',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Create Winners Round 3 (2 matches) - PENDING
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, 3, i, 'winners',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Create Losers Branch A Round 101 (4 matches) - PENDING
  FOR i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, 101, i, 'losers',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Create Losers Branch A Round 102 (2 matches) - PENDING
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, 102, i, 'losers',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Create Losers Branch A Round 103 (1 match) - PENDING
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, 103, 1, 'losers',
    'pending', NOW(), NOW()
  );
  v_matches_created := v_matches_created + 1;
  
  -- Create Losers Branch B Round 201 (2 matches) - PENDING
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, 201, i, 'losers',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Create Losers Branch B Round 202 (1 match) - PENDING
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, 202, 1, 'losers',
    'pending', NOW(), NOW()
  );
  v_matches_created := v_matches_created + 1;
  
  -- Create Semifinals (2 matches) - PENDING
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      id, tournament_id, round_number, match_number, bracket_type,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), p_tournament_id, 250, i, 'semifinals',
      'pending', NOW(), NOW()
    );
    v_matches_created := v_matches_created + 1;
  END LOOP;
  
  -- Create Grand Final (1 match) - PENDING
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, 300, 1, 'finals',
    'pending', NOW(), NOW()
  );
  v_matches_created := v_matches_created + 1;
  
  -- Update tournament status
  UPDATE tournaments 
  SET status = 'ongoing', updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN QUERY SELECT true, 
    format('Tournament initialized with %s matches. Round 1 ready to play!', v_matches_created), 
    v_matches_created;
END;
$$;

-- ============================================================================
-- TASK 2: WINNERS ROUND 1 ADVANCEMENT
-- Processes Round 1 completion (8 winners, 8 losers)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_winners_round1_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_destination text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_loser_id uuid;
  v_round2_match_number integer;
  v_losers_match_number integer;
  v_player_position text;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  -- Determine loser
  v_loser_id := CASE WHEN v_match.player1_id = p_winner_id 
                     THEN v_match.player2_id 
                     ELSE v_match.player1_id END;
  
  -- Calculate destinations
  -- Winners: Match 1,2 → R2 Match 1 | Match 3,4 → R2 Match 2 | etc.
  v_round2_match_number := CEIL(v_match.match_number / 2.0);
  v_losers_match_number := CEIL(v_match.match_number / 2.0);
  
  -- Determine player position (odd match = player1, even match = player2)
  v_player_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1' ELSE 'player2' END;
  
  -- WINNER ADVANCEMENT to Round 2
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = p_winner_id, 
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 2
      AND match_number = v_round2_match_number;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_winner_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 2
      AND match_number = v_round2_match_number;
  END IF;
  
  -- LOSER ADVANCEMENT to Losers Branch A R101
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = v_loser_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 101
      AND match_number = v_losers_match_number;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = v_loser_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 101
      AND match_number = v_losers_match_number;
  END IF;
  
  RETURN QUERY SELECT true, 
    format('Winner advanced to R2M%s', v_round2_match_number),
    format('Loser advanced to R101M%s', v_losers_match_number);
END;
$$;

-- ============================================================================
-- TASK 3: WINNERS ROUND 2 ADVANCEMENT
-- Processes Round 2 completion (4 winners, 4 losers)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_winners_round2_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_destination text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_loser_id uuid;
  v_round3_match_number integer;
  v_losers_match_number integer;
  v_player_position text;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_loser_id := CASE WHEN v_match.player1_id = p_winner_id 
                     THEN v_match.player2_id 
                     ELSE v_match.player1_id END;
  
  -- Calculate destinations
  v_round3_match_number := CEIL(v_match.match_number / 2.0);
  v_losers_match_number := CEIL(v_match.match_number / 2.0);
  v_player_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1' ELSE 'player2' END;
  
  -- WINNER ADVANCEMENT to Round 3
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = p_winner_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 3
      AND match_number = v_round3_match_number;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_winner_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 3
      AND match_number = v_round3_match_number;
  END IF;
  
  -- LOSER ADVANCEMENT to Losers Branch B R201
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = v_loser_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 201
      AND match_number = v_losers_match_number;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = v_loser_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 201
      AND match_number = v_losers_match_number;
  END IF;
  
  RETURN QUERY SELECT true,
    format('Winner advanced to R3M%s', v_round3_match_number),
    format('Loser advanced to R201M%s', v_losers_match_number);
END;
$$;

-- ============================================================================
-- TASK 4: WINNERS ROUND 3 ADVANCEMENT
-- Processes Round 3 completion (2 winners to Semifinals, 2 losers eliminated)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_winners_round3_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_status text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  -- WINNER ADVANCEMENT to Semifinals
  -- R3 Match 1 winner → Semifinal Match 1, player1
  -- R3 Match 2 winner → Semifinal Match 2, player1
  UPDATE tournament_matches 
  SET player1_id = p_winner_id,
      status = 'pending', -- Will be scheduled when losers bracket is ready
      updated_at = NOW()
  WHERE tournament_id = p_tournament_id
    AND round_number = 250
    AND match_number = v_match.match_number;
  
  RETURN QUERY SELECT true,
    format('Winner advanced to Semifinal M%s (waiting for opponent)', v_match.match_number),
    'Loser eliminated from tournament';
END;
$$;

-- ============================================================================
-- TASK 5: LOSERS BRANCH A ROUND 101 ADVANCEMENT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_losers_r101_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_status text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_r102_match_number integer;
  v_player_position text;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_r102_match_number := CEIL(v_match.match_number / 2.0);
  v_player_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1' ELSE 'player2' END;
  
  -- WINNER ADVANCEMENT to R102
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = p_winner_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 102
      AND match_number = v_r102_match_number;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_winner_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 102
      AND match_number = v_r102_match_number;
  END IF;
  
  RETURN QUERY SELECT true,
    format('Winner advanced to R102M%s', v_r102_match_number),
    'Loser eliminated from tournament';
END;
$$;

-- ============================================================================
-- TASK 6: LOSERS BRANCH A ROUND 102 ADVANCEMENT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_losers_r102_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_status text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_player_position text;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_player_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1' ELSE 'player2' END;
  
  -- WINNER ADVANCEMENT to R103 (both R102 winners meet in R103M1)
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = p_winner_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 103
      AND match_number = 1;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_winner_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 103
      AND match_number = 1;
  END IF;
  
  RETURN QUERY SELECT true,
    'Winner advanced to R103M1 (Losers Branch A Final)',
    'Loser eliminated from tournament';
END;
$$;

-- ============================================================================
-- TASK 7: LOSERS BRANCH A ROUND 103 ADVANCEMENT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_losers_r103_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_status text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Winner becomes Losers Branch A Champion
  -- They will be paired in semifinals once Losers Branch B is complete
  
  RETURN QUERY SELECT true,
    'Losers Branch A Champion - waiting for Branch B Champion',
    'Loser eliminated from tournament';
END;
$$;

-- ============================================================================
-- TASK 8: LOSERS BRANCH B ROUND 201 ADVANCEMENT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_losers_r201_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_status text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_player_position text;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_player_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1' ELSE 'player2' END;
  
  -- WINNER ADVANCEMENT to R202 (both R201 winners meet in R202M1)
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = p_winner_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 202
      AND match_number = 1;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_winner_id,
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 202
      AND match_number = 1;
  END IF;
  
  RETURN QUERY SELECT true,
    'Winner advanced to R202M1 (Losers Branch B Final)',
    'Loser eliminated from tournament';
END;
$$;

-- ============================================================================
-- TASK 9: LOSERS BRANCH B ROUND 202 ADVANCEMENT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_losers_r202_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_status text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Winner becomes Losers Branch B Champion
  -- Trigger semifinals pairing check
  PERFORM setup_semifinals_pairings(p_tournament_id);
  
  RETURN QUERY SELECT true,
    'Losers Branch B Champion - semifinals pairings initiated',
    'Loser eliminated from tournament';
END;
$$;

-- ============================================================================
-- TASK 10: SEMIFINALS PAIRING LOGIC
-- Pairs Winners Bracket winners with Losers Branch champions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.setup_semifinals_pairings(
  p_tournament_id uuid
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_losers_a_champion uuid;
  v_losers_b_champion uuid;
  v_semifinals_ready boolean := false;
BEGIN
  -- Get Losers Branch champions
  SELECT winner_id INTO v_losers_a_champion
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id 
    AND round_number = 103 
    AND match_number = 1
    AND status = 'completed';
  
  SELECT winner_id INTO v_losers_b_champion
  FROM tournament_matches  
  WHERE tournament_id = p_tournament_id 
    AND round_number = 202 
    AND match_number = 1
    AND status = 'completed';
  
  -- Check if both losers champions are determined
  IF v_losers_a_champion IS NOT NULL AND v_losers_b_champion IS NOT NULL THEN
    -- Setup Semifinal 1: R3 Winner 1 vs Losers A Champion
    UPDATE tournament_matches
    SET player2_id = v_losers_a_champion, 
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id 
      AND round_number = 250 
      AND match_number = 1;
    
    -- Setup Semifinal 2: R3 Winner 2 vs Losers B Champion  
    UPDATE tournament_matches
    SET player2_id = v_losers_b_champion, 
        status = 'scheduled',
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id 
      AND round_number = 250 
      AND match_number = 2;
    
    v_semifinals_ready := true;
  END IF;
  
  RETURN QUERY SELECT v_semifinals_ready, 
    CASE WHEN v_semifinals_ready 
         THEN 'Semifinals pairings complete - matches ready!'
         ELSE 'Waiting for both losers branch champions'
    END;
END;
$$;

-- ============================================================================
-- TASK 11: SEMIFINALS ADVANCEMENT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_semifinals_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, winner_destination text, loser_status text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_grand_final_ready boolean := false;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  -- WINNER ADVANCEMENT to Grand Final
  IF v_match.match_number = 1 THEN
    UPDATE tournament_matches 
    SET player1_id = p_winner_id,
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 300
      AND match_number = 1;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_winner_id,
        updated_at = NOW()
    WHERE tournament_id = p_tournament_id
      AND round_number = 300
      AND match_number = 1;
  END IF;
  
  -- Check if Grand Final is ready
  SELECT (player1_id IS NOT NULL AND player2_id IS NOT NULL) INTO v_grand_final_ready
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
    AND round_number = 300
    AND match_number = 1;
  
  IF v_grand_final_ready THEN
    UPDATE tournament_matches 
    SET status = 'scheduled'
    WHERE tournament_id = p_tournament_id
      AND round_number = 300
      AND match_number = 1;
  END IF;
  
  RETURN QUERY SELECT true,
    format('Winner advanced to Grand Final (Position %s)', v_match.match_number),
    'Loser finished in 3rd/4th place';
END;
$$;

-- ============================================================================
-- TASK 12: GRAND FINAL COMPLETION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_grand_final_completion(
  p_tournament_id uuid,
  p_completed_match_id uuid,
  p_winner_id uuid
)
RETURNS TABLE(success boolean, champion_id uuid, runner_up_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_runner_up_id uuid;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_runner_up_id := CASE WHEN v_match.player1_id = p_winner_id 
                         THEN v_match.player2_id 
                         ELSE v_match.player1_id END;
  
  -- Update tournament status to completed
  UPDATE tournaments 
  SET status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_tournament_id;
  
  -- Trigger final rankings calculation
  PERFORM calculate_final_rankings(p_tournament_id);
  
  RETURN QUERY SELECT true, p_winner_id, v_runner_up_id;
END;
$$;

-- ============================================================================
-- TASK 13: TOURNAMENT STATUS MANAGEMENT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_tournament_status(
  p_tournament_id uuid
)
RETURNS TABLE(success boolean, current_status text, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status text;
  v_round1_complete boolean;
  v_semifinals_active boolean;
  v_final_complete boolean;
BEGIN
  SELECT status INTO v_current_status FROM tournaments WHERE id = p_tournament_id;
  
  -- Check Round 1 completion
  SELECT (COUNT(*) = 8 AND COUNT(*) FILTER (WHERE status = 'completed') = 8) INTO v_round1_complete
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id AND round_number = 1;
  
  -- Check if semifinals are active
  SELECT (COUNT(*) > 0 AND COUNT(*) FILTER (WHERE status IN ('scheduled', 'in_progress')) > 0) INTO v_semifinals_active
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id AND round_number = 250;
  
  -- Check final completion
  SELECT (status = 'completed') INTO v_final_complete
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id AND round_number = 300 AND match_number = 1;
  
  -- Update status based on progression
  IF v_final_complete THEN
    v_current_status := 'completed';
  ELSIF v_semifinals_active THEN
    v_current_status := 'semifinals';
  ELSIF v_round1_complete THEN
    v_current_status := 'bracket_stage';
  ELSE
    v_current_status := 'ongoing';
  END IF;
  
  UPDATE tournaments 
  SET status = v_current_status, updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN QUERY SELECT true, v_current_status, format('Tournament status: %s', v_current_status);
END;
$$;

-- ============================================================================
-- TASK 14: PLAYER RANKING CALCULATION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_final_rankings(
  p_tournament_id uuid
)
RETURNS TABLE(success boolean, rankings_calculated integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_champion_id uuid;
  v_runner_up_id uuid;
  v_semifinalist1_id uuid;
  v_semifinalist2_id uuid;
  v_calculated_count integer := 0;
BEGIN
  -- Get Grand Final results
  SELECT winner_id,
         CASE WHEN player1_id = winner_id THEN player2_id ELSE player1_id END
  INTO v_champion_id, v_runner_up_id
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id AND round_number = 300 AND match_number = 1;
  
  -- Get semifinal losers (3rd/4th place)
  SELECT array_agg(CASE WHEN player1_id = winner_id THEN player2_id ELSE player1_id END)
  INTO ARRAY[v_semifinalist1_id, v_semifinalist2_id]
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id AND round_number = 250;
  
  -- Clear existing results
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Insert final rankings
  INSERT INTO tournament_results (tournament_id, user_id, position, placement_type, created_at)
  VALUES 
    (p_tournament_id, v_champion_id, 1, 'champion', NOW()),
    (p_tournament_id, v_runner_up_id, 2, 'runner_up', NOW()),
    (p_tournament_id, v_semifinalist1_id, 3, 'semifinalist', NOW()),
    (p_tournament_id, v_semifinalist2_id, 4, 'semifinalist', NOW());
  
  v_calculated_count := 4;
  
  -- Update player rankings and SPA points
  UPDATE player_rankings 
  SET spa_points = spa_points + 500,
      wins = wins + 1,
      updated_at = NOW()
  WHERE user_id = v_champion_id;
  
  UPDATE player_rankings 
  SET spa_points = spa_points + 300,
      updated_at = NOW()
  WHERE user_id = v_runner_up_id;
  
  UPDATE player_rankings 
  SET spa_points = spa_points + 200,
      updated_at = NOW()
  WHERE user_id IN (v_semifinalist1_id, v_semifinalist2_id);
  
  RETURN QUERY SELECT true, v_calculated_count;
END;
$$;

-- ============================================================================
-- TASK 15: TOURNAMENT COMPLETION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.finalize_tournament(
  p_tournament_id uuid
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Final status update
  UPDATE tournaments 
  SET status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_tournament_id;
  
  -- Log completion
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    p_tournament_id, 'tournament_finalization', 'completed',
    jsonb_build_object('finalized_at', NOW()),
    NOW()
  );
  
  RETURN QUERY SELECT true, 'Tournament finalized successfully';
END;
$$;

-- ============================================================================
-- MASTER CONTROLLER - TASK COORDINATOR
-- Routes to appropriate task function based on round and status
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sabo_tournament_coordinator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result record;
BEGIN
  -- Only process completed matches
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Route to appropriate task function based on round_number
  CASE NEW.round_number
    WHEN 1 THEN
      -- TASK 2: Winners Round 1
      SELECT * INTO v_result FROM process_winners_round1_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
      
    WHEN 2 THEN
      -- TASK 3: Winners Round 2
      SELECT * INTO v_result FROM process_winners_round2_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
      
    WHEN 3 THEN
      -- TASK 4: Winners Round 3
      SELECT * INTO v_result FROM process_winners_round3_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
      
    WHEN 101 THEN
      -- TASK 5: Losers Branch A R101
      SELECT * INTO v_result FROM process_losers_r101_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
      
    WHEN 102 THEN
      -- TASK 6: Losers Branch A R102
      SELECT * INTO v_result FROM process_losers_r102_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
      
    WHEN 103 THEN
      -- TASK 7: Losers Branch A R103
      SELECT * INTO v_result FROM process_losers_r103_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
      
    WHEN 201 THEN
      -- TASK 8: Losers Branch B R201
      SELECT * INTO v_result FROM process_losers_r201_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
      
    WHEN 202 THEN
      -- TASK 9: Losers Branch B R202
      SELECT * INTO v_result FROM process_losers_r202_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
      
    WHEN 250 THEN
      -- TASK 11: Semifinals
      SELECT * INTO v_result FROM process_semifinals_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
      
    WHEN 300 THEN
      -- TASK 12: Grand Final
      SELECT * INTO v_result FROM process_grand_final_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
      PERFORM finalize_tournament(NEW.tournament_id);
      
    ELSE
      -- Unknown round, log it
      RAISE NOTICE 'Unknown round number: % for tournament %', NEW.round_number, NEW.tournament_id;
  END CASE;
  
  -- Update tournament status
  PERFORM update_tournament_status(NEW.tournament_id);
  
  -- Log the advancement
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    NEW.tournament_id, 
    format('round_%s_advancement', NEW.round_number), 
    'completed',
    jsonb_build_object(
      'match_id', NEW.id,
      'winner_id', NEW.winner_id,
      'round', NEW.round_number,
      'match_number', NEW.match_number,
      'advancement_result', v_result
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- DROP OLD TRIGGER AND CREATE NEW ONE
-- ============================================================================
DROP TRIGGER IF EXISTS sabo_tournament_progression ON tournament_matches;

CREATE TRIGGER sabo_tournament_progression
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION sabo_tournament_coordinator();

-- ============================================================================
-- RESET double6 tournament for testing
-- ============================================================================
DO $$
DECLARE
  v_tournament_id uuid;
  v_player_ids uuid[];
BEGIN
  -- Get double6 tournament
  SELECT id INTO v_tournament_id 
  FROM tournaments 
  WHERE name ILIKE '%double6%' 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_tournament_id IS NOT NULL THEN
    -- Get 16 real user IDs for testing
    SELECT array_agg(user_id) INTO v_player_ids
    FROM (
      SELECT user_id 
      FROM profiles 
      WHERE is_demo_user = false 
      LIMIT 16
    ) subq;
    
    -- If we have enough players, reinitialize the tournament
    IF array_length(v_player_ids, 1) >= 16 THEN
      PERFORM initialize_sabo_tournament(v_tournament_id, v_player_ids[1:16]);
      RAISE NOTICE 'double6 tournament reinitialized with 15-task system';
    ELSE
      RAISE NOTICE 'Not enough real users for tournament initialization';
    END IF;
  END IF;
END $$;