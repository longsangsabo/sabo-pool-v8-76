
-- 1. Create function to automatically setup tournament structure after creation
CREATE OR REPLACE FUNCTION auto_setup_tournament_structure()
RETURNS TRIGGER AS $$
DECLARE
  v_rounds_needed INTEGER;
  v_third_place_round INTEGER;
BEGIN
  -- Calculate rounds needed for single elimination
  IF NEW.tournament_type = 'single_elimination' THEN
    v_rounds_needed := CEIL(LOG(2, NEW.max_participants));
    
    -- If has third place match, we need an additional "round" for it
    IF NEW.has_third_place_match = true THEN
      v_third_place_round := v_rounds_needed + 1;
    END IF;
    
    -- Update tournament with calculated structure info
    UPDATE tournaments 
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'calculated_rounds', v_rounds_needed,
      'third_place_round', v_third_place_round,
      'bracket_ready', false,
      'auto_setup_completed', true
    )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger for auto setup
DROP TRIGGER IF EXISTS trigger_auto_setup_tournament ON tournaments;
CREATE TRIGGER trigger_auto_setup_tournament
  AFTER INSERT ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION auto_setup_tournament_structure();

-- 3. Enhanced bracket generation function that handles third place match
CREATE OR REPLACE FUNCTION generate_complete_bracket(p_tournament_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tournament RECORD;
  v_participant_ids UUID[];
  v_rounds_needed INTEGER;
  v_matches_created INTEGER := 0;
  v_current_round INTEGER;
  v_matches_in_round INTEGER;
  i INTEGER;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get confirmed participants
  SELECT ARRAY_AGG(user_id ORDER BY created_at) INTO v_participant_ids
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed';
  
  IF array_length(v_participant_ids, 1) < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 participants');
  END IF;
  
  -- Clear existing matches
  DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
  
  -- Calculate rounds needed
  v_rounds_needed := CEIL(LOG(2, array_length(v_participant_ids, 1)));
  
  -- Generate main bracket matches
  FOR v_current_round IN 1..v_rounds_needed LOOP
    v_matches_in_round := POWER(2, v_rounds_needed - v_current_round);
    
    FOR i IN 1..v_matches_in_round LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number,
        bracket_type, status, created_at, updated_at
      ) VALUES (
        p_tournament_id, v_current_round, i,
        'main', 'pending', now(), now()
      );
      
      v_matches_created := v_matches_created + 1;
    END LOOP;
  END LOOP;
  
  -- Assign participants to first round
  FOR i IN 1..LEAST(array_length(v_participant_ids, 1), POWER(2, v_rounds_needed - 1)) LOOP
    IF i % 2 = 1 THEN
      -- Odd numbered participant goes to player1
      UPDATE tournament_matches 
      SET player1_id = v_participant_ids[i]
      WHERE tournament_id = p_tournament_id 
      AND round_number = 1 
      AND match_number = CEIL(i::numeric / 2);
    ELSE
      -- Even numbered participant goes to player2
      UPDATE tournament_matches 
      SET player2_id = v_participant_ids[i]
      WHERE tournament_id = p_tournament_id 
      AND round_number = 1 
      AND match_number = CEIL(i::numeric / 2);
    END IF;
  END LOOP;
  
  -- Create third place match if enabled
  IF v_tournament.has_third_place_match = true AND v_rounds_needed >= 2 THEN
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number,
      bracket_type, is_third_place_match, status, created_at, updated_at
    ) VALUES (
      p_tournament_id, v_rounds_needed + 1, 1,
      'playoff', true, 'pending', now(), now()
    );
    
    v_matches_created := v_matches_created + 1;
  END IF;
  
  -- Update tournament metadata
  UPDATE tournaments 
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'bracket_ready', true,
    'total_matches_created', v_matches_created,
    'bracket_generated_at', now()
  )
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'matches_created', v_matches_created,
    'rounds_created', v_rounds_needed,
    'has_third_place', v_tournament.has_third_place_match
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to auto-advance winners in bracket
CREATE OR REPLACE FUNCTION advance_tournament_winner(p_match_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_next_match_id UUID;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_is_player1 BOOLEAN;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND OR v_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found or no winner');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  -- Don't advance if this is the final match
  IF v_match.bracket_type = 'main' THEN
    -- Calculate if this is the final
    SELECT COUNT(*) INTO v_next_round 
    FROM tournament_matches 
    WHERE tournament_id = v_match.tournament_id 
    AND round_number > v_match.round_number
    AND bracket_type = 'main';
    
    IF v_next_round = 0 THEN
      -- This is the final, handle tournament completion
      IF v_tournament.has_third_place_match = true THEN
        -- Setup third place match with semifinal losers
        UPDATE tournament_matches 
        SET 
          player1_id = (
            SELECT CASE WHEN winner_id = player1_id THEN player2_id ELSE player1_id END
            FROM tournament_matches 
            WHERE tournament_id = v_match.tournament_id 
            AND round_number = v_match.round_number 
            AND match_number != v_match.match_number
            AND status = 'completed'
            LIMIT 1
          ),
          player2_id = (
            SELECT CASE WHEN winner_id = player1_id THEN player2_id ELSE player1_id END
            FROM tournament_matches 
            WHERE id = p_match_id
          ),
          status = 'scheduled'
        WHERE tournament_id = v_match.tournament_id 
        AND is_third_place_match = true;
      END IF;
      
      RETURN jsonb_build_object('success', true, 'message', 'Final completed');
    END IF;
    
    -- Find next match
    v_next_round := v_match.round_number + 1;
    v_next_match_number := CEIL(v_match.match_number::numeric / 2);
    v_is_player1 := (v_match.match_number % 2 = 1);
    
    -- Get next match ID
    SELECT id INTO v_next_match_id
    FROM tournament_matches 
    WHERE tournament_id = v_match.tournament_id 
    AND round_number = v_next_round 
    AND match_number = v_next_match_number
    AND bracket_type = 'main';
    
    IF v_next_match_id IS NOT NULL THEN
      -- Advance winner to next round
      IF v_is_player1 THEN
        UPDATE tournament_matches 
        SET player1_id = v_match.winner_id, status = 'scheduled'
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_match.winner_id, status = 'scheduled'
        WHERE id = v_next_match_id;
      END IF;
    END IF;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'advanced_to', v_next_match_id);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to auto-advance winners when match is completed
CREATE OR REPLACE FUNCTION trigger_advance_winner()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when match status changes to completed and has a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Advance winner to next round
    PERFORM advance_tournament_winner(NEW.id);
    
    -- Check if tournament should be completed
    PERFORM check_tournament_completion(NEW.tournament_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_advance_winner ON tournament_matches;
CREATE TRIGGER trigger_advance_winner
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_advance_winner();

-- 6. Function to check and complete tournament automatically
CREATE OR REPLACE FUNCTION check_tournament_completion(p_tournament_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tournament RECORD;
  v_final_completed BOOLEAN := false;
  v_third_place_completed BOOLEAN := true; -- Default true if no third place match
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  -- Check if final is completed
  SELECT (status = 'completed' AND winner_id IS NOT NULL) INTO v_final_completed
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND bracket_type = 'main'
  AND round_number = (
    SELECT MAX(round_number) 
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND bracket_type = 'main'
  )
  LIMIT 1;
  
  -- Check third place match if exists
  IF v_tournament.has_third_place_match = true THEN
    SELECT COALESCE((status = 'completed' AND winner_id IS NOT NULL), false) 
    INTO v_third_place_completed
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND is_third_place_match = true
    LIMIT 1;
  END IF;
  
  -- Complete tournament if both final and third place (if exists) are done
  IF v_final_completed AND v_third_place_completed THEN
    UPDATE tournaments 
    SET status = 'completed', updated_at = now()
    WHERE id = p_tournament_id AND status != 'completed';
    
    -- Trigger results processing
    PERFORM complete_tournament_automatically(p_tournament_id);
    
    RETURN jsonb_build_object('success', true, 'tournament_completed', true);
  END IF;
  
  RETURN jsonb_build_object('success', true, 'tournament_completed', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
