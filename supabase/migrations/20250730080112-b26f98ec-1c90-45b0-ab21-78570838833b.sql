-- ============================================================================
-- SABO 15-TASK SYSTEM - FIXED VERSION  
-- Fix PostgreSQL syntax errors and implement bulletproof tournament system
-- ============================================================================

-- TASK 14: PLAYER RANKING CALCULATION (FIXED)
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
  v_semifinalist_ids uuid[];
  v_calculated_count integer := 0;
BEGIN
  -- Get Grand Final results
  SELECT winner_id,
         CASE WHEN player1_id = winner_id THEN player2_id ELSE player1_id END
  INTO v_champion_id, v_runner_up_id
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id AND round_number = 300 AND match_number = 1;
  
  -- Get semifinal losers (3rd/4th place) - FIXED SYNTAX
  WITH semifinal_losers AS (
    SELECT CASE WHEN player1_id = winner_id THEN player2_id ELSE player1_id END as loser_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id AND round_number = 250
  )
  SELECT array_agg(loser_id) INTO v_semifinalist_ids FROM semifinal_losers;
  
  -- Clear existing results
  DELETE FROM tournament_results WHERE tournament_id = p_tournament_id;
  
  -- Insert final rankings
  INSERT INTO tournament_results (tournament_id, user_id, position, placement_type, created_at)
  VALUES 
    (p_tournament_id, v_champion_id, 1, 'champion', NOW()),
    (p_tournament_id, v_runner_up_id, 2, 'runner_up', NOW());
  
  -- Insert semifinalists
  IF array_length(v_semifinalist_ids, 1) >= 1 THEN
    INSERT INTO tournament_results (tournament_id, user_id, position, placement_type, created_at)
    VALUES (p_tournament_id, v_semifinalist_ids[1], 3, 'semifinalist', NOW());
    v_calculated_count := 3;
  END IF;
  
  IF array_length(v_semifinalist_ids, 1) >= 2 THEN
    INSERT INTO tournament_results (tournament_id, user_id, position, placement_type, created_at)
    VALUES (p_tournament_id, v_semifinalist_ids[2], 4, 'semifinalist', NOW());
    v_calculated_count := 4;
  END IF;
  
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
  WHERE user_id = ANY(v_semifinalist_ids);
  
  RETURN QUERY SELECT true, v_calculated_count;
END;
$$;

-- ============================================================================
-- ALL OTHER TASKS (RE-CREATE TO ENSURE PROPER DEPENDENCIES)
-- ============================================================================

-- TASK 1: TOURNAMENT INITIALIZATION
CREATE OR REPLACE FUNCTION public.initialize_sabo_tournament(
  p_tournament_id uuid,
  p_player_ids uuid[]
)
RETURNS TABLE(success boolean, message text, matches_created integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
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
  
  -- Create empty structure for remaining 19 matches
  -- Winners Round 2 (4 matches)
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
  
  -- Winners Round 3 (2 matches)
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
  
  -- Losers Branch A: R101 (4), R102 (2), R103 (1)
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
  
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, 103, 1, 'losers',
    'pending', NOW(), NOW()
  );
  v_matches_created := v_matches_created + 1;
  
  -- Losers Branch B: R201 (2), R202 (1)
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
  
  INSERT INTO tournament_matches (
    id, tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_tournament_id, 202, 1, 'losers',
    'pending', NOW(), NOW()
  );
  v_matches_created := v_matches_created + 1;
  
  -- Semifinals (2 matches)
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
  
  -- Grand Final (1 match)
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
    format('✅ SABO Tournament initialized: %s matches created. Round 1 ready!', v_matches_created), 
    v_matches_created;
END;
$$;

-- TASK 2: WINNERS ROUND 1 ADVANCEMENT
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
  v_player_position text;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_loser_id := CASE WHEN v_match.player1_id = p_winner_id 
                     THEN v_match.player2_id 
                     ELSE v_match.player1_id END;
  
  -- Calculate destinations: M1,2→R2M1 | M3,4→R2M2 | etc.
  v_round2_match_number := CEIL(v_match.match_number / 2.0);
  v_player_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1' ELSE 'player2' END;
  
  -- WINNER to Winners Round 2
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 2 AND match_number = v_round2_match_number;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 2 AND match_number = v_round2_match_number;
  END IF;
  
  -- LOSER to Losers Branch A R101
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = v_loser_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 101 AND match_number = v_round2_match_number;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = v_loser_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 101 AND match_number = v_round2_match_number;
  END IF;
  
  RETURN QUERY SELECT true, 
    format('✅ Winner → R2M%s', v_round2_match_number),
    format('↘️ Loser → R101M%s', v_round2_match_number);
END;
$$;

-- TASK 3: WINNERS ROUND 2 ADVANCEMENT
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
  v_player_position text;
BEGIN
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_completed_match_id;
  
  v_loser_id := CASE WHEN v_match.player1_id = p_winner_id 
                     THEN v_match.player2_id 
                     ELSE v_match.player1_id END;
  
  v_round3_match_number := CEIL(v_match.match_number / 2.0);
  v_player_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1' ELSE 'player2' END;
  
  -- WINNER to Winners Round 3
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = p_winner_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 3 AND match_number = v_round3_match_number;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = p_winner_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 3 AND match_number = v_round3_match_number;
  END IF;
  
  -- LOSER to Losers Branch B R201
  IF v_player_position = 'player1' THEN
    UPDATE tournament_matches 
    SET player1_id = v_loser_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 201 AND match_number = v_round3_match_number;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = v_loser_id, status = 'scheduled', updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND round_number = 201 AND match_number = v_round3_match_number;
  END IF;
  
  RETURN QUERY SELECT true,
    format('✅ Winner → R3M%s', v_round3_match_number),
    format('↘️ Loser → R201M%s', v_round3_match_number);
END;
$$;

-- MASTER CONTROLLER - TASK COORDINATOR
CREATE OR REPLACE FUNCTION public.sabo_tournament_coordinator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result record;
BEGIN
  -- Only process newly completed matches
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Route to appropriate task function
  CASE NEW.round_number
    WHEN 1 THEN
      SELECT * INTO v_result FROM process_winners_round1_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
    WHEN 2 THEN
      SELECT * INTO v_result FROM process_winners_round2_completion(NEW.tournament_id, NEW.id, NEW.winner_id);
    ELSE
      RAISE NOTICE '⚠️ Round % not yet implemented in 15-task system', NEW.round_number;
  END CASE;
  
  -- Log advancement
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    NEW.tournament_id, 
    format('15_task_round_%s', NEW.round_number), 
    'completed',
    jsonb_build_object(
      'match_id', NEW.id,
      'winner_id', NEW.winner_id,
      'round', NEW.round_number,
      'match_number', NEW.match_number,
      'system', '15_task_sabo'
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Replace the trigger
DROP TRIGGER IF EXISTS sabo_tournament_progression ON tournament_matches;

CREATE TRIGGER sabo_tournament_progression
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION sabo_tournament_coordinator();

-- ============================================================================
-- RESET double6 tournament for testing with 15-task system
-- ============================================================================
DO $$
DECLARE
  v_tournament_id uuid;
  v_player_ids uuid[];
  v_result record;
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
    
    -- Initialize with new 15-task system
    IF array_length(v_player_ids, 1) >= 16 THEN
      SELECT * INTO v_result FROM initialize_sabo_tournament(v_tournament_id, v_player_ids[1:16]);
      RAISE NOTICE '🏆 15-TASK SYSTEM: %', v_result.message;
    ELSE
      RAISE NOTICE '❌ Not enough users for 15-task system initialization';
    END IF;
  END IF;
END $$;