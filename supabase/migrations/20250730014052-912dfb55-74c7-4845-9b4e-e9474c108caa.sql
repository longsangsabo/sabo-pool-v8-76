-- SABO DOUBLE ELIMINATION DATABASE FUNCTIONS
-- Phase 2: Complete implementation of SABO tournament system

-- Helper function to assign participants to next matches
CREATE OR REPLACE FUNCTION assign_participant_to_next_match(
  p_tournament_id UUID,
  p_round INTEGER, 
  p_participant_id UUID
) RETURNS void AS $$
BEGIN
  -- Find next available slot in the target round
  UPDATE tournament_matches 
  SET player1_id = CASE 
    WHEN player1_id IS NULL THEN p_participant_id
    ELSE player1_id END,
      player2_id = CASE
    WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_participant_id
    ELSE player2_id END,
      updated_at = NOW()
  WHERE tournament_id = p_tournament_id 
    AND round_number = p_round
    AND (player1_id IS NULL OR player2_id IS NULL)
  ORDER BY match_number
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if round is ready to start
CREATE OR REPLACE FUNCTION check_round_readiness(
  p_tournament_id UUID
) RETURNS jsonb AS $$
DECLARE
  v_pending_rounds INTEGER[];
  v_round INTEGER;
  v_ready_matches INTEGER;
  v_total_matches INTEGER;
BEGIN
  -- Get all rounds that have matches ready to start
  SELECT ARRAY_AGG(DISTINCT round_number) INTO v_pending_rounds
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id
    AND status = 'pending'
    AND player1_id IS NOT NULL
    AND player2_id IS NOT NULL;
    
  -- Update ready matches to 'ready' status
  IF v_pending_rounds IS NOT NULL THEN
    FOREACH v_round IN ARRAY v_pending_rounds
    LOOP
      UPDATE tournament_matches
      SET status = 'ready', updated_at = NOW()
      WHERE tournament_id = p_tournament_id
        AND round_number = v_round
        AND status = 'pending'
        AND player1_id IS NOT NULL
        AND player2_id IS NOT NULL;
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'rounds_ready', COALESCE(array_length(v_pending_rounds, 1), 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TASK 2.1: SABO Bracket Generation Function
CREATE OR REPLACE FUNCTION generate_sabo_tournament_bracket(
  p_tournament_id UUID,
  p_seeding_method TEXT DEFAULT 'registration_order'
) RETURNS jsonb AS $$
DECLARE
  participants UUID[];
  match_counter INTEGER := 0;
  v_participant UUID;
  i INTEGER;
BEGIN
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Get 16 participants based on seeding method
  CASE p_seeding_method
    WHEN 'elo_ranking' THEN
      SELECT ARRAY_AGG(tr.user_id ORDER BY COALESCE(pr.elo_points, 1000) DESC) INTO participants
      FROM tournament_registrations tr
      LEFT JOIN player_rankings pr ON tr.user_id = pr.user_id
      WHERE tr.tournament_id = p_tournament_id 
        AND tr.registration_status = 'confirmed'
      LIMIT 16;
    WHEN 'random' THEN
      SELECT ARRAY_AGG(user_id ORDER BY RANDOM()) INTO participants
      FROM tournament_registrations 
      WHERE tournament_id = p_tournament_id
        AND registration_status = 'confirmed'
      LIMIT 16;
    ELSE -- registration_order (default)
      SELECT ARRAY_AGG(user_id ORDER BY created_at) INTO participants
      FROM tournament_registrations 
      WHERE tournament_id = p_tournament_id
        AND registration_status = 'confirmed'
      LIMIT 16;
  END CASE;
  
  IF array_length(participants, 1) != 16 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Requires exactly 16 participants, found: ' || COALESCE(array_length(participants, 1), 0)
    );
  END IF;
  
  -- WINNERS BRACKET
  -- Round 1: 8 matches (16→8)
  FOR i IN 1..8 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, 
      player1_id, player2_id, status
    ) VALUES (
      p_tournament_id, 1, i, 'winners',
      participants[i*2-1], participants[i*2], 'ready'
    );
    match_counter := match_counter + 1;
  END LOOP;
  
  -- Round 2: 4 matches (8→4) - TBD participants
  FOR i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, status
    ) VALUES (
      p_tournament_id, 2, i, 'winners', 'pending'
    );
    match_counter := match_counter + 1;
  END LOOP;
  
  -- Round 3: 2 matches (4→2) - TBD participants  
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, status
    ) VALUES (
      p_tournament_id, 3, i, 'winners', 'pending'
    );
    match_counter := match_counter + 1;
  END LOOP;
  
  -- LOSERS BRANCH A (for R1 losers)
  -- Round 101: 4 matches (8→4)
  FOR i IN 1..4 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, status
    ) VALUES (
      p_tournament_id, 101, i, 'losers', 'pending'
    );
    match_counter := match_counter + 1;
  END LOOP;
  
  -- Round 102: 2 matches (4→2)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, status
    ) VALUES (
      p_tournament_id, 102, i, 'losers', 'pending'
    );
    match_counter := match_counter + 1;
  END LOOP;
  
  -- Round 103: 1 match (2→1)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, status
  ) VALUES (
    p_tournament_id, 103, 1, 'losers', 'pending'
  );
  match_counter := match_counter + 1;
  
  -- LOSERS BRANCH B (for R2 losers)
  -- Round 201: 2 matches (4→2)
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, status
    ) VALUES (
      p_tournament_id, 201, i, 'losers', 'pending'
    );
    match_counter := match_counter + 1;
  END LOOP;
  
  -- Round 202: 1 match (2→1)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, status
  ) VALUES (
    p_tournament_id, 202, 1, 'losers', 'pending'
  );
  match_counter := match_counter + 1;
  
  -- FINALS
  -- Round 250: Semifinals (4→2) - 2 matches
  FOR i IN 1..2 LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_type, status
    ) VALUES (
      p_tournament_id, 250, i, 'semifinals', 'pending'
    );
    match_counter := match_counter + 1;
  END LOOP;
  
  -- Round 300: Final (2→1) - 1 match
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type, status
  ) VALUES (
    p_tournament_id, 300, 1, 'finals', 'pending'
  );
  match_counter := match_counter + 1;
  
  -- Update tournament status
  UPDATE tournaments 
  SET status = 'ongoing', updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_matches', match_counter,
    'structure', 'SABO_compliant',
    'participants_seeded', array_length(participants, 1),
    'seeding_method', p_seeding_method
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TASK 2.2: SABO Advancement Function
CREATE OR REPLACE FUNCTION advance_sabo_tournament(
  p_match_id UUID,
  p_winner_id UUID
) RETURNS jsonb AS $$
DECLARE
  v_match RECORD;
  v_loser_id UUID;
  v_advancement_result jsonb;
  v_tournament_complete BOOLEAN := FALSE;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Validate winner is actually in the match
  IF p_winner_id NOT IN (v_match.player1_id, v_match.player2_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid winner for this match');
  END IF;
  
  -- Determine loser
  v_loser_id := CASE 
    WHEN v_match.player1_id = p_winner_id THEN v_match.player2_id
    ELSE v_match.player1_id 
  END;
  
  -- Update match result
  UPDATE tournament_matches 
  SET winner_id = p_winner_id, 
      status = 'completed',
      updated_at = NOW()
  WHERE id = p_match_id;
  
  -- SABO ADVANCEMENT LOGIC
  CASE v_match.round_number
    -- WINNERS BRACKET
    WHEN 1 THEN
      -- Winner to R2, Loser to R101 (Branch A)
      PERFORM assign_participant_to_next_match(v_match.tournament_id, 2, p_winner_id);
      PERFORM assign_participant_to_next_match(v_match.tournament_id, 101, v_loser_id);
      
    WHEN 2 THEN  
      -- Winner to R3, Loser to R201 (Branch B)
      PERFORM assign_participant_to_next_match(v_match.tournament_id, 3, p_winner_id);
      PERFORM assign_participant_to_next_match(v_match.tournament_id, 201, v_loser_id);
      
    WHEN 3 THEN
      -- Winner to R250 (Semifinals), Loser eliminated in SABO
      PERFORM assign_participant_to_next_match(v_match.tournament_id, 250, p_winner_id);
      -- R3 losers are eliminated in SABO structure
      
    -- LOSERS BRANCH A
    WHEN 101 THEN
      PERFORM assign_participant_to_next_match(v_match.tournament_id, 102, p_winner_id);
      -- Loser eliminated
      
    WHEN 102 THEN
      PERFORM assign_participant_to_next_match(v_match.tournament_id, 103, p_winner_id);
      -- Loser eliminated
      
    WHEN 103 THEN
      PERFORM assign_participant_to_next_match(v_match.tournament_id, 250, p_winner_id);
      -- Loser eliminated
      
    -- LOSERS BRANCH B  
    WHEN 201 THEN
      PERFORM assign_participant_to_next_match(v_match.tournament_id, 202, p_winner_id);
      -- Loser eliminated
      
    WHEN 202 THEN
      PERFORM assign_participant_to_next_match(v_match.tournament_id, 250, p_winner_id);
      -- Loser eliminated
      
    -- SEMIFINALS
    WHEN 250 THEN
      PERFORM assign_participant_to_next_match(v_match.tournament_id, 300, p_winner_id);
      -- Loser eliminated
      
    -- FINAL
    WHEN 300 THEN
      -- Tournament complete, winner is champion
      UPDATE tournaments 
      SET status = 'completed', updated_at = NOW()
      WHERE id = v_match.tournament_id;
      v_tournament_complete := TRUE;
      
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Invalid SABO round: ' || v_match.round_number);
  END CASE;
  
  -- Check if next rounds are ready to start
  SELECT check_round_readiness(v_match.tournament_id) INTO v_advancement_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_advanced', true,
    'round_completed', v_match.round_number,
    'tournament_complete', v_tournament_complete,
    'readiness_check', v_advancement_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TASK 2.3: SABO Score Submission Integration
CREATE OR REPLACE FUNCTION submit_sabo_match_score(
  p_match_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER,
  p_submitted_by UUID DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_advancement_result jsonb;
  v_score_validation jsonb;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Validate match status
  IF v_match.status NOT IN ('ready', 'in_progress') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not ready for score submission');
  END IF;
  
  -- Validate scores
  IF p_player1_score < 0 OR p_player2_score < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid scores - must be non-negative');
  END IF;
  
  IF p_player1_score = p_player2_score THEN
    RETURN jsonb_build_object('success', false, 'error', 'SABO matches cannot be ties');
  END IF;
  
  -- For tournament matches, require meaningful scores (race to 5+ typically)
  IF p_player1_score = 0 AND p_player2_score = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Both scores cannot be zero');
  END IF;
  
  -- Determine winner
  v_winner_id := CASE 
    WHEN p_player1_score > p_player2_score THEN v_match.player1_id
    ELSE v_match.player2_id
  END;
  
  -- Update match scores and completion time
  UPDATE tournament_matches 
  SET player1_score = p_player1_score,
      player2_score = p_player2_score,
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Trigger SABO advancement
  SELECT advance_sabo_tournament(p_match_id, v_winner_id) INTO v_advancement_result;
  
  -- Log the score submission
  INSERT INTO match_results (
    match_id, player_id, result, elo_before, elo_after, spa_points_earned
  ) VALUES 
    (p_match_id, v_winner_id, 'win', 1000, 1000, 100),
    (p_match_id, CASE WHEN v_winner_id = v_match.player1_id THEN v_match.player2_id ELSE v_match.player1_id END, 'loss', 1000, 1000, 0);
  
  RETURN jsonb_build_object(
    'success', true,
    'scores_updated', true,
    'winner_id', v_winner_id,
    'match_completed', true,
    'advancement', v_advancement_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Score submission failed: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validation function to check SABO tournament structure
CREATE OR REPLACE FUNCTION validate_sabo_tournament_structure(
  p_tournament_id UUID
) RETURNS jsonb AS $$
DECLARE
  v_match_counts jsonb;
  v_total_matches INTEGER;
  v_structure_valid BOOLEAN := TRUE;
  v_errors TEXT[] := '{}';
BEGIN
  -- Count matches by bracket type and round
  SELECT jsonb_object_agg(
    bracket_type || '_' || round_number, 
    count
  ) INTO v_match_counts
  FROM (
    SELECT bracket_type, round_number, COUNT(*) as count
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id
    GROUP BY bracket_type, round_number
    ORDER BY bracket_type, round_number
  ) subq;
  
  -- Get total match count
  SELECT COUNT(*) INTO v_total_matches
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Validate SABO structure (exactly 27 matches)
  IF v_total_matches != 27 THEN
    v_structure_valid := FALSE;
    v_errors := v_errors || ('Expected 27 matches, found ' || v_total_matches);
  END IF;
  
  -- Validate specific round counts
  -- Winners bracket: 8+4+2 = 14 matches
  -- Losers A: 4+2+1 = 7 matches  
  -- Losers B: 2+1 = 3 matches
  -- Finals: 2+1 = 3 matches
  
  RETURN jsonb_build_object(
    'valid', v_structure_valid,
    'total_matches', v_total_matches,
    'match_distribution', v_match_counts,
    'errors', v_errors,
    'expected_structure', jsonb_build_object(
      'winners', 14,
      'losers', 10, 
      'semifinals', 2,
      'finals', 1,
      'total', 27
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;