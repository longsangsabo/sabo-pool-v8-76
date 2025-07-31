-- STEP 1: Fix key functions with proper search_path and permissions

-- Fix advance_double_elimination_winner_comprehensive function
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner_comprehensive(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_tournament_id UUID;
  v_next_winner_match RECORD;
  v_next_loser_match RECORD;
  v_winner_advanced BOOLEAN := false;
  v_loser_placed BOOLEAN := false;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id AND status = 'completed';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found or not completed');
  END IF;
  
  v_winner_id := v_match.winner_id;
  v_loser_id := CASE WHEN v_match.player1_id = v_winner_id THEN v_match.player2_id ELSE v_match.player1_id END;
  v_tournament_id := v_match.tournament_id;
  
  -- Advance winner to next round
  IF v_match.bracket_type = 'winners' THEN
    -- Find next winners bracket match
    SELECT * INTO v_next_winner_match
    FROM tournament_matches 
    WHERE tournament_id = v_tournament_id 
      AND bracket_type = 'winners'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_winner_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_winner_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_winner_match.id;
      END IF;
      v_winner_advanced := true;
    END IF;
    
    -- Place loser in losers bracket
    SELECT * INTO v_next_loser_match
    FROM tournament_matches 
    WHERE tournament_id = v_tournament_id 
      AND bracket_type = 'losers'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY round_number, match_number
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_loser_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, updated_at = NOW()
        WHERE id = v_next_loser_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, updated_at = NOW()
        WHERE id = v_next_loser_match.id;
      END IF;
      v_loser_placed := true;
    END IF;
    
  ELSE -- losers bracket
    -- Find next losers bracket match
    SELECT * INTO v_next_loser_match
    FROM tournament_matches 
    WHERE tournament_id = v_tournament_id 
      AND bracket_type = 'losers'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_loser_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_loser_match.id;
      ELSE
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_loser_match.id;
      END IF;
      v_winner_advanced := true;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'bracket_type', v_match.bracket_type,
    'winner_advanced', v_winner_advanced,
    'loser_placed', v_loser_placed
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Fix repair_double_elimination_bracket function
CREATE OR REPLACE FUNCTION public.repair_double_elimination_bracket(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_completed_match RECORD;
  v_fixed_count INTEGER := 0;
  v_created_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Fix advancement for all completed matches that haven't been processed
  FOR v_completed_match IN
    SELECT tm.*
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
    ORDER BY tm.round_number, tm.match_number
  LOOP
    -- Try to advance this match's winner
    SELECT public.advance_double_elimination_winner_comprehensive(v_completed_match.id) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
      IF (v_result->>'winner_advanced')::boolean OR (v_result->>'loser_placed')::boolean THEN
        v_fixed_count := v_fixed_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'fixed_advancements', v_fixed_count,
    'created_matches', v_created_count,
    'repair_summary', format('Fixed %s advancements, created %s matches', v_fixed_count, v_created_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- STEP 2: Create essential triggers

-- Trigger to auto-advance winners when match is completed
CREATE OR REPLACE FUNCTION public.auto_advance_tournament_winner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  -- Only process when a match gets a winner
  IF NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) AND NEW.status = 'completed' THEN
    -- Auto-advance the winner
    SELECT public.advance_double_elimination_winner_comprehensive(NEW.id) INTO v_result;
    
    -- Log the advancement
    INSERT INTO tournament_automation_log (
      tournament_id, automation_type, status, details, completed_at
    ) VALUES (
      NEW.tournament_id, 'auto_advancement', 
      CASE WHEN (v_result->>'success')::boolean THEN 'completed' ELSE 'failed' END,
      v_result,
      CASE WHEN (v_result->>'success')::boolean THEN NOW() ELSE NULL END
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_advance_winner_trigger ON tournament_matches;
CREATE TRIGGER auto_advance_winner_trigger
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION auto_advance_tournament_winner();

-- Trigger to check tournament completion
CREATE OR REPLACE FUNCTION public.check_tournament_completion_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_final_round INTEGER;
  v_final_match_completed BOOLEAN;
  v_tournament_status TEXT;
  v_champion_id UUID;
BEGIN
  -- Get current tournament status
  SELECT status INTO v_tournament_status
  FROM tournaments 
  WHERE id = NEW.tournament_id;
  
  -- Only check completion for ongoing tournaments
  IF v_tournament_status != 'ongoing' THEN
    RETURN NEW;
  END IF;
  
  -- Get final round number
  SELECT MAX(round_number) INTO v_final_round
  FROM tournament_matches 
  WHERE tournament_id = NEW.tournament_id;
  
  -- Check if the final match is completed with a winner
  SELECT 
    (status = 'completed' AND winner_id IS NOT NULL),
    winner_id
  INTO v_final_match_completed, v_champion_id
  FROM tournament_matches 
  WHERE tournament_id = NEW.tournament_id 
    AND round_number = v_final_round 
    AND match_number = 1
    AND bracket_type = 'winners';
  
  -- If final match is completed, mark tournament as completed
  IF v_final_match_completed THEN
    UPDATE tournaments 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.tournament_id
      AND status != 'completed';
    
    -- Log tournament completion
    INSERT INTO tournament_automation_log (
      tournament_id, automation_type, status, details, completed_at
    ) VALUES (
      NEW.tournament_id, 'tournament_completion', 'completed',
      jsonb_build_object(
        'champion_id', v_champion_id,
        'completion_trigger', 'final_match_completed',
        'final_match_id', NEW.id
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the completion trigger
DROP TRIGGER IF EXISTS check_completion_trigger ON tournament_matches;
CREATE TRIGGER check_completion_trigger
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION check_tournament_completion_trigger();

-- STEP 3: Fix the NGU1 tournament by running repair
SELECT public.repair_double_elimination_bracket(
  (SELECT id FROM tournaments WHERE name ILIKE '%ngu1%' ORDER BY created_at DESC LIMIT 1)
) as ngu1_repair_result;