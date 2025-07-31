
-- Fix tournament automation functions with proper permissions and logic

-- 1. Function to advance winner to next round
CREATE OR REPLACE FUNCTION advance_winner_to_next_round(p_completed_match_id UUID)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_next_match_id UUID;
  v_winner_id UUID;
  v_next_match RECORD;
BEGIN
  -- Get completed match details
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_completed_match_id AND status = 'completed';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found or not completed');
  END IF;
  
  -- Get winner
  v_winner_id := v_match.winner_id;
  
  IF v_winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No winner determined');
  END IF;
  
  -- Find next round match
  SELECT id INTO v_next_match_id
  FROM tournament_matches
  WHERE tournament_id = v_match.tournament_id
  AND round_number = v_match.round_number + 1
  AND (
    (v_match.match_number % 2 = 1 AND match_number = (v_match.match_number + 1) / 2) OR
    (v_match.match_number % 2 = 0 AND match_number = v_match.match_number / 2)
  )
  AND (player1_id IS NULL OR player2_id IS NULL);
  
  IF v_next_match_id IS NULL THEN
    RETURN jsonb_build_object('info', 'No next round match to advance to');
  END IF;
  
  -- Get next match details
  SELECT * INTO v_next_match FROM tournament_matches WHERE id = v_next_match_id;
  
  -- Advance winner to next round
  IF v_next_match.player1_id IS NULL THEN
    UPDATE tournament_matches 
    SET player1_id = v_winner_id, updated_at = NOW()
    WHERE id = v_next_match_id;
  ELSE
    UPDATE tournament_matches 
    SET player2_id = v_winner_id, updated_at = NOW()
    WHERE id = v_next_match_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_advanced', v_winner_id,
    'to_match', v_next_match_id,
    'next_round', v_match.round_number + 1
  );
END;
$$;

-- 2. Function to release table after match completion
CREATE OR REPLACE FUNCTION release_table_after_match(p_match_id UUID)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table_id UUID;
BEGIN
  -- Get assigned table from match
  SELECT assigned_table_id INTO v_table_id
  FROM tournament_matches
  WHERE id = p_match_id AND status = 'completed';
  
  IF v_table_id IS NULL THEN
    RETURN jsonb_build_object('info', 'No table assigned to this match');
  END IF;
  
  -- Release the table
  UPDATE club_tables
  SET 
    status = 'available',
    current_match_id = NULL,
    updated_at = NOW()
  WHERE id = v_table_id;
  
  -- Clear table assignment from match
  UPDATE tournament_matches
  SET 
    assigned_table_id = NULL,
    table_released_at = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'table_released', v_table_id,
    'match_id', p_match_id
  );
END;
$$;

-- 3. Function to auto-assign tables to ready matches
CREATE OR REPLACE FUNCTION auto_assign_ready_matches(p_tournament_id UUID)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ready_match RECORD;
  v_available_table RECORD;
  v_assignments INTEGER := 0;
BEGIN
  -- Get matches that have both players and no assigned table
  FOR v_ready_match IN
    SELECT id, round_number, match_number, player1_id, player2_id
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
    AND player1_id IS NOT NULL
    AND player2_id IS NOT NULL
    AND assigned_table_id IS NULL
    AND status = 'scheduled'
    ORDER BY round_number, match_number
  LOOP
    -- Find available table
    SELECT id, table_number INTO v_available_table
    FROM club_tables ct
    WHERE ct.club_id = (
      SELECT club_id FROM tournaments WHERE id = p_tournament_id
    )
    AND ct.status = 'available'
    AND ct.current_match_id IS NULL
    LIMIT 1;
    
    IF FOUND THEN
      -- Assign table to match
      UPDATE tournament_matches
      SET 
        assigned_table_id = v_available_table.id,
        assigned_table_number = v_available_table.table_number,
        updated_at = NOW()
      WHERE id = v_ready_match.id;
      
      -- Mark table as occupied
      UPDATE club_tables
      SET 
        status = 'occupied',
        current_match_id = v_ready_match.id,
        updated_at = NOW()
      WHERE id = v_available_table.id;
      
      v_assignments := v_assignments + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'assignments_made', v_assignments,
    'tournament_id', p_tournament_id
  );
END;
$$;

-- 4. Master function to process match completion
CREATE OR REPLACE FUNCTION process_match_completion(p_match_id UUID)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_advance_result JSONB;
  v_release_result JSONB;
  v_assign_result JSONB;
  v_total_result JSONB := '{}';
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  IF v_match.status != 'completed' THEN
    RETURN jsonb_build_object('error', 'Match not completed yet');
  END IF;
  
  -- Step 1: Advance winner to next round
  SELECT advance_winner_to_next_round(p_match_id) INTO v_advance_result;
  v_total_result := v_total_result || jsonb_build_object('winner_advancement', v_advance_result);
  
  -- Step 2: Release table
  SELECT release_table_after_match(p_match_id) INTO v_release_result;
  v_total_result := v_total_result || jsonb_build_object('table_release', v_release_result);
  
  -- Step 3: Auto-assign ready matches
  SELECT auto_assign_ready_matches(v_match.tournament_id) INTO v_assign_result;
  v_total_result := v_total_result || jsonb_build_object('auto_assignments', v_assign_result);
  
  -- Step 4: Create notifications for next round players
  IF (v_advance_result->>'success')::boolean = true THEN
    -- Notify the advanced player
    INSERT INTO notifications (user_id, type, title, message, priority, metadata)
    SELECT 
      v_match.winner_id,
      'tournament_advancement',
      'Thắng và tiến vòng!',
      format('Bạn đã thắng và tiến vào vòng %s của giải đấu', (v_advance_result->>'next_round')::text),
      'high',
      jsonb_build_object(
        'tournament_id', v_match.tournament_id,
        'next_match_id', v_advance_result->>'to_match',
        'round', v_advance_result->>'next_round'
      )
    WHERE v_match.winner_id IS NOT NULL;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'automation_results', v_total_result
  );
END;
$$;

-- 5. Update trigger for automatic tournament progression
CREATE OR REPLACE FUNCTION trigger_tournament_automation()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when match becomes completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Process match completion in background
    PERFORM process_match_completion(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS tournament_progression_automation ON tournament_matches;

-- Create new trigger for tournament progression
CREATE TRIGGER tournament_progression_automation
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_tournament_automation();
