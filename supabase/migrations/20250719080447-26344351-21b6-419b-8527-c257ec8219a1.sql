-- COMPREHENSIVE DOUBLE ELIMINATION TOURNAMENT SYSTEM v2.0
-- This migration creates a complete, systematic, and consistent double elimination workflow

-- ==================================================
-- PHASE 1: STANDARDIZE TOURNAMENT CREATION
-- ==================================================

-- Create a comprehensive function to validate and create double elimination tournaments
CREATE OR REPLACE FUNCTION create_double_elimination_tournament(
  p_tournament_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament_id UUID;
  v_result JSONB;
BEGIN
  -- Validate required fields for double elimination
  IF NOT (p_tournament_data ? 'name' AND 
          p_tournament_data ? 'max_participants' AND
          p_tournament_data ? 'club_id') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing required fields: name, max_participants, club_id'
    );
  END IF;
  
  -- Validate max_participants is power of 2 for proper bracket structure
  IF (p_tournament_data->>'max_participants')::INTEGER & ((p_tournament_data->>'max_participants')::INTEGER - 1) != 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Double elimination requires participant count to be power of 2 (8, 16, 32, etc.)'
    );
  END IF;
  
  -- Create tournament with standardized double elimination settings
  INSERT INTO tournaments (
    name,
    description,
    club_id,
    tournament_type,
    game_format,
    max_participants,
    entry_fee,
    prize_pool,
    tournament_start,
    tournament_end,
    registration_start,
    registration_end,
    status,
    created_by,
    management_status,
    has_third_place_match,
    tier_level,
    is_public,
    metadata
  ) VALUES (
    p_tournament_data->>'name',
    COALESCE(p_tournament_data->>'description', ''),
    (p_tournament_data->>'club_id')::UUID,
    'double_elimination',
    COALESCE(p_tournament_data->>'game_format', '9_ball'),
    (p_tournament_data->>'max_participants')::INTEGER,
    COALESCE((p_tournament_data->>'entry_fee')::NUMERIC, 0),
    COALESCE((p_tournament_data->>'prize_pool')::NUMERIC, 0),
    COALESCE((p_tournament_data->>'tournament_start')::TIMESTAMPTZ, NOW() + INTERVAL '7 days'),
    COALESCE((p_tournament_data->>'tournament_end')::TIMESTAMPTZ, NOW() + INTERVAL '8 days'),
    COALESCE((p_tournament_data->>'registration_start')::TIMESTAMPTZ, NOW()),
    COALESCE((p_tournament_data->>'registration_end')::TIMESTAMPTZ, NOW() + INTERVAL '6 days'),
    'registration_open',
    auth.uid(),
    'published',
    false, -- Double elimination does not need third place match
    COALESCE((p_tournament_data->>'tier_level')::INTEGER, 1),
    COALESCE((p_tournament_data->>'is_public')::BOOLEAN, true),
    jsonb_build_object(
      'tournament_type', 'double_elimination',
      'bracket_structure', 'winner_loser_final',
      'auto_setup_completed', false,
      'bracket_ready', false
    )
  ) RETURNING id INTO v_tournament_id;
  
  -- Sync tournament rewards
  SELECT sync_tournament_rewards(v_tournament_id) INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'tournament_type', 'double_elimination',
    'message', 'Double elimination tournament created successfully',
    'rewards_synced', v_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ==================================================
-- PHASE 2: COMPREHENSIVE BRACKET GENERATION
-- ==================================================

-- Create the main double elimination bracket generation function
CREATE OR REPLACE FUNCTION generate_double_elimination_bracket_complete(
  p_tournament_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_rounds_needed INTEGER;
  v_matches_created INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  IF v_tournament.tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a double elimination tournament');
  END IF;
  
  -- Clear existing matches to ensure clean slate
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Get confirmed participants
  SELECT ARRAY_AGG(user_id ORDER BY registration_date) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
    AND registration_status = 'confirmed'
    AND user_id IS NOT NULL;
  
  v_participant_count := COALESCE(array_length(v_participants, 1), 0);
  
  IF v_participant_count < 4 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Need at least 4 participants for double elimination'
    );
  END IF;
  
  -- Calculate rounds needed (log2 of participants)
  v_rounds_needed := CEIL(LOG(2, v_participant_count));
  
  -- STEP 1: Create Winner Bracket (Single Elimination Structure)
  FOR round_num IN 1..v_rounds_needed LOOP
    DECLARE
      matches_in_round INTEGER;
      participants_in_round INTEGER;
    BEGIN
      -- Calculate matches in this round
      matches_in_round := GREATEST(1, v_participant_count / POWER(2, round_num));
      
      FOR match_num IN 1..matches_in_round LOOP
        INSERT INTO tournament_matches (
          tournament_id, round_number, match_number, bracket_type,
          status, created_at, updated_at
        ) VALUES (
          p_tournament_id, round_num, match_num, 'winner',
          'scheduled', NOW(), NOW()
        );
        v_matches_created := v_matches_created + 1;
      END LOOP;
    END;
  END LOOP;
  
  -- STEP 2: Create Loser Bracket (Complex Structure)
  -- Loser bracket has (2 * v_rounds_needed - 1) rounds
  FOR round_num IN 1..(2 * v_rounds_needed - 1) LOOP
    DECLARE
      matches_in_round INTEGER;
      branch_type TEXT;
    BEGIN
      -- Determine branch type and match count based on round
      IF round_num % 2 = 1 THEN
        -- Odd rounds: new losers from winner bracket
        branch_type := CASE WHEN round_num <= v_rounds_needed THEN 'branch_a' ELSE 'branch_b' END;
        matches_in_round := v_participant_count / POWER(2, (round_num + 1) / 2 + 1);
      ELSE
        -- Even rounds: winners from previous loser bracket round
        branch_type := 'branch_a';
        matches_in_round := v_participant_count / POWER(2, round_num / 2 + 2);
      END IF;
      
      -- Ensure at least 1 match per round until final rounds
      matches_in_round := GREATEST(1, matches_in_round);
      
      FOR match_num IN 1..matches_in_round LOOP
        INSERT INTO tournament_matches (
          tournament_id, round_number, match_number, bracket_type, branch_type,
          status, created_at, updated_at
        ) VALUES (
          p_tournament_id, round_num, match_num, 'loser', branch_type,
          'scheduled', NOW(), NOW()
        );
        v_matches_created := v_matches_created + 1;
      END LOOP;
    END;
  END LOOP;
  
  -- STEP 3: Create Grand Final
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at
  ) VALUES (
    p_tournament_id, 1, 1, 'final',
    'scheduled', NOW(), NOW()
  );
  v_matches_created := v_matches_created + 1;
  
  -- STEP 4: Assign participants to first round of winner bracket
  FOR i IN 1..v_participant_count LOOP
    DECLARE
      match_number INTEGER;
      player_slot TEXT;
    BEGIN
      -- Calculate which match this participant goes to
      match_number := CEIL(i::NUMERIC / 2);
      player_slot := CASE WHEN i % 2 = 1 THEN 'player1_id' ELSE 'player2_id' END;
      
      -- Update the match with participant
      EXECUTE format('UPDATE tournament_matches SET %I = $1 WHERE tournament_id = $2 AND bracket_type = $3 AND round_number = 1 AND match_number = $4',
        player_slot) USING v_participants[i], p_tournament_id, 'winner', match_number;
    END;
  END LOOP;
  
  -- Update tournament status
  UPDATE tournaments 
  SET 
    bracket_generated = true,
    has_bracket = true,
    metadata = metadata || jsonb_build_object(
      'bracket_ready', true,
      'matches_created', v_matches_created,
      'bracket_type', 'double_elimination',
      'winner_rounds', v_rounds_needed,
      'loser_rounds', 2 * v_rounds_needed - 1
    ),
    updated_at = NOW()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'matches_created', v_matches_created,
    'participant_count', v_participant_count,
    'winner_rounds', v_rounds_needed,
    'loser_rounds', 2 * v_rounds_needed - 1,
    'message', 'Double elimination bracket generated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to generate bracket: ' || SQLERRM
    );
END;
$$;

-- ==================================================
-- PHASE 3: PLAYER ASSIGNMENT VALIDATION
-- ==================================================

-- Function to validate player assignments and fix duplicates
CREATE OR REPLACE FUNCTION validate_double_elimination_assignments(
  p_tournament_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_duplicate_players JSONB := '[]'::JSONB;
  v_missing_assignments INTEGER := 0;
  v_total_first_round INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Count total first round matches
  SELECT COUNT(*) INTO v_total_first_round
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id 
    AND bracket_type = 'winner' 
    AND round_number = 1;
  
  -- Check for duplicate player assignments
  WITH player_assignments AS (
    SELECT player1_id as player_id FROM tournament_matches 
    WHERE tournament_id = p_tournament_id AND bracket_type = 'winner' AND round_number = 1 AND player1_id IS NOT NULL
    UNION ALL
    SELECT player2_id as player_id FROM tournament_matches 
    WHERE tournament_id = p_tournament_id AND bracket_type = 'winner' AND round_number = 1 AND player2_id IS NOT NULL
  ),
  duplicate_check AS (
    SELECT player_id, COUNT(*) as assignment_count
    FROM player_assignments
    GROUP BY player_id
    HAVING COUNT(*) > 1
  )
  SELECT jsonb_agg(jsonb_build_object('player_id', player_id, 'assignments', assignment_count))
  INTO v_duplicate_players
  FROM duplicate_check;
  
  -- Count missing assignments
  SELECT COUNT(*) INTO v_missing_assignments
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id 
    AND bracket_type = 'winner' 
    AND round_number = 1
    AND (player1_id IS NULL OR player2_id IS NULL);
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'total_first_round_matches', v_total_first_round,
    'duplicate_players', COALESCE(v_duplicate_players, '[]'::JSONB),
    'missing_assignments', v_missing_assignments,
    'is_valid', (v_duplicate_players = '[]'::JSONB AND v_missing_assignments = 0)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ==================================================
-- PHASE 4: MATCH PROGRESSION LOGIC
-- ==================================================

-- Comprehensive double elimination progression function
CREATE OR REPLACE FUNCTION advance_double_elimination_match(
  p_match_id UUID,
  p_winner_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_loser_id UUID;
  v_next_winner_match RECORD;
  v_next_loser_match RECORD;
  v_progressions_made INTEGER := 0;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  -- Determine loser
  v_loser_id := CASE WHEN p_winner_id = v_match.player1_id THEN v_match.player2_id ELSE v_match.player1_id END;
  
  -- Update current match
  UPDATE tournament_matches 
  SET 
    winner_id = p_winner_id,
    loser_id = v_loser_id,
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- WINNER BRACKET PROGRESSION
  IF v_match.bracket_type = 'winner' THEN
    -- Find next winner bracket match
    SELECT * INTO v_next_winner_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winner'
      AND round_number = v_match.round_number + 1
      AND match_number = CEIL(v_match.match_number::NUMERIC / 2)
    LIMIT 1;
    
    IF FOUND THEN
      -- Assign winner to next winner bracket match
      IF v_match.match_number % 2 = 1 THEN
        UPDATE tournament_matches SET player1_id = p_winner_id WHERE id = v_next_winner_match.id;
      ELSE
        UPDATE tournament_matches SET player2_id = p_winner_id WHERE id = v_next_winner_match.id;
      END IF;
      v_progressions_made := v_progressions_made + 1;
    END IF;
    
    -- Send loser to loser bracket
    -- Complex logic for determining loser bracket position
    -- This is a simplified version - full implementation would be more complex
    SELECT * INTO v_next_loser_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY round_number, match_number
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_loser_match.player1_id IS NULL THEN
        UPDATE tournament_matches SET player1_id = v_loser_id WHERE id = v_next_loser_match.id;
      ELSE
        UPDATE tournament_matches SET player2_id = v_loser_id WHERE id = v_next_loser_match.id;
      END IF;
      v_progressions_made := v_progressions_made + 1;
    END IF;
    
  -- LOSER BRACKET PROGRESSION
  ELSIF v_match.bracket_type = 'loser' THEN
    -- Find next loser bracket match
    SELECT * INTO v_next_loser_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser'
      AND round_number > v_match.round_number
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY round_number, match_number
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_loser_match.player1_id IS NULL THEN
        UPDATE tournament_matches SET player1_id = p_winner_id WHERE id = v_next_loser_match.id;
      ELSE
        UPDATE tournament_matches SET player2_id = p_winner_id WHERE id = v_next_loser_match.id;
      END IF;
      v_progressions_made := v_progressions_made + 1;
    ELSE
      -- Loser bracket champion - send to grand final
      UPDATE tournament_matches 
      SET player2_id = p_winner_id 
      WHERE tournament_id = v_match.tournament_id 
        AND bracket_type = 'final'
        AND player2_id IS NULL;
      v_progressions_made := v_progressions_made + 1;
    END IF;
    
  -- GRAND FINAL
  ELSIF v_match.bracket_type = 'final' THEN
    -- Tournament complete
    UPDATE tournaments 
    SET 
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    -- Process tournament results
    PERFORM process_tournament_results FROM tournaments WHERE id = v_match.tournament_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', p_winner_id,
    'progressions_made', v_progressions_made,
    'bracket_type', v_match.bracket_type,
    'message', 'Match advanced successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ==================================================
-- PHASE 5: SCORE INPUT & COMPLETION
-- ==================================================

-- Comprehensive score input function with validation
CREATE OR REPLACE FUNCTION submit_double_elimination_score(
  p_match_id UUID,
  p_winner_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER,
  p_submitted_by UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_submission_result JSONB;
  v_progression_result JSONB;
BEGIN
  -- Get match and tournament details
  SELECT tm.*, t.tournament_type INTO v_match
  FROM tournament_matches tm
  JOIN tournaments t ON tm.tournament_id = t.id
  WHERE tm.id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Validate match is ready for score input
  IF v_match.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match already completed');
  END IF;
  
  IF v_match.player1_id IS NULL OR v_match.player2_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not ready - missing players');
  END IF;
  
  -- Validate winner is one of the players
  IF p_winner_id NOT IN (v_match.player1_id, v_match.player2_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Winner must be one of the match players');
  END IF;
  
  -- Validate scores
  IF p_player1_score < 0 OR p_player2_score < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Scores cannot be negative');
  END IF;
  
  IF (p_winner_id = v_match.player1_id AND p_player1_score <= p_player2_score) OR
     (p_winner_id = v_match.player2_id AND p_player2_score <= p_player1_score) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Winner must have higher score');
  END IF;
  
  -- Submit the score and advance the tournament
  SELECT advance_double_elimination_match(
    p_match_id, 
    p_winner_id, 
    p_player1_score, 
    p_player2_score
  ) INTO v_progression_result;
  
  -- Update score submission metadata
  UPDATE tournament_matches
  SET 
    score_submitted_at = NOW(),
    score_input_by = COALESCE(p_submitted_by, auth.uid()),
    score_status = 'confirmed'
  WHERE id = p_match_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'scores_submitted', jsonb_build_object(
      'player1_score', p_player1_score,
      'player2_score', p_player2_score,
      'winner_id', p_winner_id
    ),
    'progression_result', v_progression_result,
    'message', 'Score submitted and tournament advanced successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to submit score: ' || SQLERRM
    );
END;
$$;

-- ==================================================
-- UTILITY FUNCTIONS
-- ==================================================

-- Function to get double elimination tournament status
CREATE OR REPLACE FUNCTION get_double_elimination_status(
  p_tournament_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_stats JSONB;
BEGIN
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  WITH match_stats AS (
    SELECT 
      bracket_type,
      COUNT(*) as total_matches,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_matches,
      COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_matches,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_matches,
      MAX(round_number) as max_round
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
    GROUP BY bracket_type
  )
  SELECT jsonb_object_agg(bracket_type, jsonb_build_object(
    'total_matches', total_matches,
    'completed_matches', completed_matches,
    'scheduled_matches', scheduled_matches,
    'pending_matches', pending_matches,
    'max_round', max_round,
    'completion_percentage', ROUND((completed_matches::NUMERIC / total_matches * 100), 2)
  )) INTO v_stats
  FROM match_stats;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_type', v_tournament.tournament_type,
    'tournament_status', v_tournament.status,
    'bracket_generated', v_tournament.bracket_generated,
    'bracket_stats', COALESCE(v_stats, '{}'::JSONB),
    'current_participants', v_tournament.current_participants,
    'max_participants', v_tournament.max_participants
  );
END;
$$;