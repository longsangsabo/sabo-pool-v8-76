-- Fix double elimination bracket generation to create proper structure
-- Separate single and double elimination logic completely

-- First, fix the generate_double_elimination_bracket_complete function
CREATE OR REPLACE FUNCTION public.generate_double_elimination_bracket_complete(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_round_number INTEGER;
  v_match_number INTEGER;
  v_winners_bracket_matches INTEGER := 0;
  v_losers_bracket_matches INTEGER := 0;
  v_total_matches INTEGER := 0;
  v_bracket_structure JSONB;
  v_winners_bracket_rounds INTEGER;
  v_losers_bracket_rounds INTEGER;
  v_pair_count INTEGER;
  v_i INTEGER;
  v_j INTEGER;
  v_loser_round INTEGER;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Verify this is a double elimination tournament
  IF v_tournament.tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('error', 'This function is only for double elimination tournaments');
  END IF;
  
  -- Get confirmed participants
  SELECT array_agg(user_id) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed'
  ORDER BY registration_date;
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants for double elimination');
  END IF;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Calculate bracket structure for double elimination
  v_winners_bracket_rounds := CEIL(LOG(2, v_participant_count));
  v_losers_bracket_rounds := (v_winners_bracket_rounds - 1) * 2;
  
  -- Create winners bracket matches (same as single elimination)
  v_round_number := 1;
  v_pair_count := v_participant_count;
  
  WHILE v_pair_count > 1 LOOP
    v_match_number := 1;
    
    -- Create matches for this round
    FOR v_i IN 1..CEIL(v_pair_count::float / 2) LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, bracket_type,
        player1_id, player2_id, status, created_at, updated_at
      ) VALUES (
        p_tournament_id, v_round_number, v_match_number, 'winners',
        CASE WHEN v_round_number = 1 AND (v_i * 2 - 1) <= v_participant_count 
             THEN v_participants[v_i * 2 - 1] ELSE NULL END,
        CASE WHEN v_round_number = 1 AND (v_i * 2) <= v_participant_count 
             THEN v_participants[v_i * 2] ELSE NULL END,
        'pending', NOW(), NOW()
      );
      
      v_match_number := v_match_number + 1;
      v_winners_bracket_matches := v_winners_bracket_matches + 1;
    END LOOP;
    
    v_pair_count := CEIL(v_pair_count::float / 2);
    v_round_number := v_round_number + 1;
  END LOOP;
  
  -- Create losers bracket structure
  -- Losers bracket has a complex structure with multiple rounds
  v_loser_round := 1;
  
  -- Initial losers bracket rounds (receive losers from winners bracket round 1)
  FOR v_i IN 1..(v_winners_bracket_rounds - 1) LOOP
    -- Calculate matches for this losers round
    v_match_number := 1;
    v_pair_count := POWER(2, v_winners_bracket_rounds - v_i - 1);
    
    -- First phase: losers from winners bracket face each other
    FOR v_j IN 1..v_pair_count LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, bracket_type,
        status, created_at, updated_at
      ) VALUES (
        p_tournament_id, v_loser_round, v_match_number, 'losers',
        'pending', NOW(), NOW()
      );
      
      v_match_number := v_match_number + 1;
      v_losers_bracket_matches := v_losers_bracket_matches + 1;
    END LOOP;
    
    v_loser_round := v_loser_round + 1;
    
    -- Second phase: winners from previous losers round vs new losers from winners bracket
    IF v_i < v_winners_bracket_rounds - 1 THEN
      FOR v_j IN 1..v_pair_count LOOP
        INSERT INTO tournament_matches (
          tournament_id, round_number, match_number, bracket_type,
          status, created_at, updated_at
        ) VALUES (
          p_tournament_id, v_loser_round, v_match_number, 'losers',
          'pending', NOW(), NOW()
        );
        
        v_match_number := v_match_number + 1;
        v_losers_bracket_matches := v_losers_bracket_matches + 1;
      END LOOP;
      
      v_loser_round := v_loser_round + 1;
    END IF;
  END LOOP;
  
  -- Create grand final matches
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at, is_grand_final
  ) VALUES (
    p_tournament_id, v_loser_round, 1, 'grand_final',
    'pending', NOW(), NOW(), true
  );
  
  v_losers_bracket_matches := v_losers_bracket_matches + 1;
  
  -- Potential second grand final (if losers bracket winner wins first grand final)
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    status, created_at, updated_at, is_grand_final
  ) VALUES (
    p_tournament_id, v_loser_round + 1, 1, 'grand_final_reset',
    'pending', NOW(), NOW(), true
  );
  
  v_losers_bracket_matches := v_losers_bracket_matches + 1;
  
  v_total_matches := v_winners_bracket_matches + v_losers_bracket_matches;
  
  -- Build bracket structure info
  v_bracket_structure := jsonb_build_object(
    'tournament_type', 'double_elimination',
    'participant_count', v_participant_count,
    'winners_bracket_rounds', v_winners_bracket_rounds,
    'losers_bracket_rounds', v_losers_bracket_rounds,
    'winners_bracket_matches', v_winners_bracket_matches,
    'losers_bracket_matches', v_losers_bracket_matches,
    'total_matches', v_total_matches,
    'has_grand_final', true,
    'has_grand_final_reset', true
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_type', 'double_elimination',
    'participant_count', v_participant_count,
    'total_matches', v_total_matches,
    'winners_bracket_matches', v_winners_bracket_matches,
    'losers_bracket_matches', v_losers_bracket_matches,
    'rounds_created', v_loser_round + 1,
    'bracket_structure', v_bracket_structure,
    'message', 'Double elimination bracket created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to create double elimination bracket: %s', SQLERRM)
    );
END;
$$;

-- Create separate single elimination function to ensure independence
CREATE OR REPLACE FUNCTION public.generate_single_elimination_bracket_complete(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_round_number INTEGER;
  v_match_number INTEGER;
  v_total_matches INTEGER := 0;
  v_bracket_structure JSONB;
  v_total_rounds INTEGER;
  v_pair_count INTEGER;
  v_i INTEGER;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Verify this is a single elimination tournament
  IF v_tournament.tournament_type != 'single_elimination' THEN
    RETURN jsonb_build_object('error', 'This function is only for single elimination tournaments');
  END IF;
  
  -- Get confirmed participants
  SELECT array_agg(user_id) INTO v_participants
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed'
  ORDER BY registration_date;
  
  v_participant_count := array_length(v_participants, 1);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants for single elimination');
  END IF;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Calculate total rounds needed
  v_total_rounds := CEIL(LOG(2, v_participant_count));
  
  -- Create single elimination bracket
  v_round_number := 1;
  v_pair_count := v_participant_count;
  
  WHILE v_pair_count > 1 LOOP
    v_match_number := 1;
    
    -- Create matches for this round
    FOR v_i IN 1..CEIL(v_pair_count::float / 2) LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, bracket_type,
        player1_id, player2_id, status, created_at, updated_at
      ) VALUES (
        p_tournament_id, v_round_number, v_match_number, 'main',
        CASE WHEN v_round_number = 1 AND (v_i * 2 - 1) <= v_participant_count 
             THEN v_participants[v_i * 2 - 1] ELSE NULL END,
        CASE WHEN v_round_number = 1 AND (v_i * 2) <= v_participant_count 
             THEN v_participants[v_i * 2] ELSE NULL END,
        'pending', NOW(), NOW()
      );
      
      v_match_number := v_match_number + 1;
      v_total_matches := v_total_matches + 1;
    END LOOP;
    
    v_pair_count := CEIL(v_pair_count::float / 2);
    v_round_number := v_round_number + 1;
  END LOOP;
  
  -- Build bracket structure info
  v_bracket_structure := jsonb_build_object(
    'tournament_type', 'single_elimination',
    'participant_count', v_participant_count,
    'total_rounds', v_total_rounds,
    'total_matches', v_total_matches,
    'has_third_place', false
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_type', 'single_elimination',
    'participant_count', v_participant_count,
    'total_matches', v_total_matches,
    'rounds_created', v_total_rounds,
    'bracket_structure', v_bracket_structure,
    'message', 'Single elimination bracket created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to create single elimination bracket: %s', SQLERRM)
    );
END;
$$;

-- Create triggers for auto-advancement
CREATE OR REPLACE FUNCTION public.trigger_tournament_match_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament_type TEXT;
  v_advancement_result JSONB;
BEGIN
  -- Only process when match is completed and has a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL 
     AND (OLD.status != 'completed' OR OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Get tournament type
    SELECT tournament_type INTO v_tournament_type
    FROM tournaments 
    WHERE id = NEW.tournament_id;
    
    -- Call appropriate advancement function based on tournament type
    IF v_tournament_type = 'double_elimination' THEN
      SELECT public.advance_double_elimination_winner_comprehensive(NEW.id) INTO v_advancement_result;
    ELSE
      SELECT public.advance_winner_to_next_round_enhanced(NEW.id, FALSE) INTO v_advancement_result;
    END IF;
    
    RAISE NOTICE 'Auto-advancement triggered for match %: %', NEW.id, v_advancement_result;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS tournament_match_completion_trigger ON tournament_matches;
CREATE TRIGGER tournament_match_completion_trigger
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_tournament_match_completion();

-- Clean up all remaining old functions
DROP FUNCTION IF EXISTS advance_simplified_double_elimination(uuid, uuid);
DROP FUNCTION IF EXISTS create_double_elimination_tournament(uuid);
DROP FUNCTION IF EXISTS get_double_elimination_next_loser_match(uuid, integer, integer);
DROP FUNCTION IF EXISTS get_double_elimination_next_winner_match(uuid, integer, integer);
DROP FUNCTION IF EXISTS create_double_elimination_bracket_simplified(uuid);
DROP FUNCTION IF EXISTS advance_double_elimination_simplified(uuid, uuid);

-- Update the general bracket generation function to use proper separation
CREATE OR REPLACE FUNCTION public.generate_complete_tournament_bracket(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament_type TEXT;
  v_result JSONB;
BEGIN
  -- Get tournament type
  SELECT tournament_type INTO v_tournament_type
  FROM tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Call appropriate function based on tournament type
  IF v_tournament_type = 'double_elimination' THEN
    SELECT public.generate_double_elimination_bracket_complete(p_tournament_id) INTO v_result;
  ELSE
    SELECT public.generate_single_elimination_bracket_complete(p_tournament_id) INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$;