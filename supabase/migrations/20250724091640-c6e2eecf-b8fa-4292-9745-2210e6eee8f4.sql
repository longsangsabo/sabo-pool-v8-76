-- Step 1: Check current triggers and create comprehensive automation system

-- Drop existing problematic triggers to avoid conflicts
DROP TRIGGER IF EXISTS auto_advance_winner_trigger ON tournament_matches;
DROP TRIGGER IF EXISTS check_tournament_completion_trigger ON tournament_matches;
DROP TRIGGER IF EXISTS notify_winner_advancement_trigger ON tournament_matches;

-- Create unified advancement function for simplified double elimination
CREATE OR REPLACE FUNCTION public.advance_simplified_double_elimination(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_match RECORD;
  v_loser_match RECORD;
  v_result jsonb;
BEGIN
  -- Get match details
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id AND status = 'completed' AND winner_id IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found or not completed');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  v_winner_id := v_match.winner_id;
  v_loser_id := CASE 
    WHEN v_match.player1_id = v_winner_id THEN v_match.player2_id 
    ELSE v_match.player1_id 
  END;
  
  -- Log advancement
  RAISE NOTICE 'Advancing match %: winner=%, loser=%, bracket=%, round=%', 
    p_match_id, v_winner_id, v_loser_id, v_match.bracket_type, v_match.round_number;
  
  -- Handle Winners Bracket advancement
  IF v_match.bracket_type = 'winners' THEN
    -- Advance winner to next winners round
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winners'
      AND round_number = v_match.round_number + 1
      AND ((player1_id IS NULL AND match_number = CEIL(v_match.match_number::float / 2)) 
           OR (player2_id IS NULL AND match_number = CEIL(v_match.match_number::float / 2)))
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      END IF;
    END IF;
    
    -- Place loser in appropriate loser bracket
    IF v_match.round_number = 1 THEN
      -- Round 1 losers go to Losers Branch A
      SELECT * INTO v_loser_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'losers_branch_a'
        AND round_number = 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
      
      IF FOUND THEN
        IF v_loser_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_loser_id, updated_at = NOW()
          WHERE id = v_loser_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_loser_id, updated_at = NOW()
          WHERE id = v_loser_match.id;
        END IF;
      END IF;
      
    ELSIF v_match.round_number = 2 THEN
      -- Round 2 losers go to Losers Branch B
      SELECT * INTO v_loser_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'losers_branch_b'
        AND round_number = 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
      
      IF FOUND THEN
        IF v_loser_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_loser_id, updated_at = NOW()
          WHERE id = v_loser_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_loser_id, updated_at = NOW()
          WHERE id = v_loser_match.id;
        END IF;
      END IF;
      
    ELSIF v_match.round_number = 3 THEN
      -- Round 3 losers go to semifinals
      SELECT * INTO v_loser_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'semifinal'
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
      
      IF FOUND THEN
        IF v_loser_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_loser_id, updated_at = NOW()
          WHERE id = v_loser_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_loser_id, updated_at = NOW()
          WHERE id = v_loser_match.id;
        END IF;
      END IF;
    END IF;
  
  -- Handle Loser Branch A advancement  
  ELSIF v_match.bracket_type = 'losers_branch_a' THEN
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'losers_branch_a'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      END IF;
    ELSE
      -- Final of Branch A, go to semifinals
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'semifinal'
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
      
      IF FOUND THEN
        IF v_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
        END IF;
      END IF;
    END IF;
  
  -- Handle Loser Branch B advancement
  ELSIF v_match.bracket_type = 'losers_branch_b' THEN
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'losers_branch_b'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      END IF;
    ELSE
      -- Final of Branch B, go to semifinals
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'semifinal'
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
      
      IF FOUND THEN
        IF v_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
        END IF;
      END IF;
    END IF;
  
  -- Handle Semifinals advancement
  ELSIF v_match.bracket_type = 'semifinal' THEN
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'final'
      AND (player1_id IS NULL OR player2_id IS NULL)
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
      END IF;
    END IF;
  
  -- Handle Final
  ELSIF v_match.bracket_type = 'final' THEN
    -- Tournament completed, update tournament status
    UPDATE tournaments 
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = v_match.tournament_id;
  END IF;
  
  -- Log successful advancement
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    v_match.tournament_id, 'auto_double_elimination_advancement', 'completed',
    jsonb_build_object(
      'match_id', p_match_id,
      'bracket_type', v_match.bracket_type,
      'round_number', v_match.round_number,
      'winner_id', v_winner_id,
      'loser_id', v_loser_id
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_advanced', true,
    'loser_placed', v_loser_id IS NOT NULL
  );
  
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO tournament_automation_log (
      tournament_id, automation_type, status, error_message, completed_at
    ) VALUES (
      v_match.tournament_id, 'auto_double_elimination_advancement', 'failed',
      SQLERRM, NOW()
    );
    
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Create the main automation trigger function
CREATE OR REPLACE FUNCTION public.trigger_simplified_double_elimination()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Only trigger when a match is completed with a winner
  IF NEW.status = 'completed' 
     AND NEW.winner_id IS NOT NULL 
     AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    RAISE NOTICE 'Auto-advancing simplified double elimination for match %', NEW.id;
    
    -- Call advancement function
    SELECT public.advance_simplified_double_elimination(NEW.id) INTO v_result;
    
    RAISE NOTICE 'Advancement result: %', v_result;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER simplified_double_elimination_trigger
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_simplified_double_elimination();

-- Create recovery function for tournaments with issues
CREATE OR REPLACE FUNCTION public.recover_tournament_simplified(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_result jsonb;
  v_fixed_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting recovery for tournament %', p_tournament_id;
  
  -- Process all completed matches in order
  FOR v_match IN
    SELECT id, bracket_type, round_number, match_number, winner_id
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
      AND status = 'completed' 
      AND winner_id IS NOT NULL
    ORDER BY 
      CASE bracket_type 
        WHEN 'winners' THEN 1 
        WHEN 'losers_branch_a' THEN 2
        WHEN 'losers_branch_b' THEN 3
        WHEN 'semifinal' THEN 4
        WHEN 'final' THEN 5
      END,
      round_number, match_number
  LOOP
    RAISE NOTICE 'Re-processing match %: bracket=%, round=%, winner=%', 
      v_match.id, v_match.bracket_type, v_match.round_number, v_match.winner_id;
    
    SELECT public.advance_simplified_double_elimination(v_match.id) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
      v_fixed_count := v_fixed_count + 1;
    ELSE
      RAISE WARNING 'Failed to process match %: %', v_match.id, v_result->>'error';
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'matches_processed', v_fixed_count,
    'message', 'Tournament recovery completed'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM, 'matches_processed', v_fixed_count);
END;
$$;