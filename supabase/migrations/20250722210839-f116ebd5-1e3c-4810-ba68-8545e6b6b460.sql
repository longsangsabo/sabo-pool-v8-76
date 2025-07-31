
-- Phase 1: Khôi phục Triggers (Cấp thiết) - Critical Triggers Restoration

-- 1. First, ensure the enhanced advancement function exists and is working
CREATE OR REPLACE FUNCTION public.advance_winner_to_next_round_enhanced(p_match_id uuid, p_force_advance boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_next_match RECORD;
  v_tournament RECORD;
  v_final_round INTEGER;
  v_is_final_match BOOLEAN;
  v_next_match_number INTEGER;
  v_slot_position TEXT;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  IF v_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No winner set for this match');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  -- Get final round number
  SELECT MAX(round_number) INTO v_final_round
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id;
  
  -- Check if this is the final match
  v_is_final_match := (v_match.round_number = v_final_round AND v_match.match_number = 1 AND (v_match.is_third_place_match IS NULL OR v_match.is_third_place_match = false));
  
  -- If this is the final match, no advancement needed - tournament should be completed by trigger
  IF v_is_final_match THEN
    RAISE NOTICE 'Final match completed - tournament should be marked as completed by trigger';
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Final match completed - tournament completion triggered',
      'final_match', true,
      'winner_id', v_match.winner_id,
      'tournament_id', v_match.tournament_id
    );
  END IF;
  
  -- For non-final matches, find next round match
  -- Calculate next match number (each pair of matches feeds into one next round match)
  v_next_match_number := CEIL(v_match.match_number::DECIMAL / 2);
  
  -- Determine if winner goes to player1 or player2 slot
  v_slot_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1' ELSE 'player2' END;
  
  -- Find the next round match
  SELECT * INTO v_next_match
  FROM tournament_matches
  WHERE tournament_id = v_match.tournament_id
  AND round_number = v_match.round_number + 1
  AND match_number = v_next_match_number;
  
  IF v_next_match IS NULL THEN
    -- Create next round match if it doesn't exist
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, status, bracket_type
    ) VALUES (
      v_match.tournament_id, v_match.round_number + 1, v_next_match_number, 'pending', COALESCE(v_match.bracket_type, 'single_elimination')
    ) RETURNING * INTO v_next_match;
  END IF;
  
  -- Advance winner to appropriate slot
  IF v_slot_position = 'player1' THEN
    UPDATE tournament_matches
    SET player1_id = v_match.winner_id,
        status = CASE 
          WHEN player2_id IS NOT NULL THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  ELSE
    UPDATE tournament_matches
    SET player2_id = v_match.winner_id,
        status = CASE 
          WHEN player1_id IS NOT NULL THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  END IF;
  
  RAISE NOTICE 'Advanced winner % from match % to next round match % (% slot)', 
    v_match.winner_id, p_match_id, v_next_match.id, v_slot_position;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_advanced', true,
    'next_match_id', v_next_match.id,
    'slot_position', v_slot_position,
    'winner_id', v_match.winner_id,
    'tournament_id', v_match.tournament_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to advance winner: %s', SQLERRM)
    );
END;
$$;

-- 2. Create wrapper function for compatibility
CREATE OR REPLACE FUNCTION public.advance_winner_to_next_round(p_match_id uuid, p_force_advance boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simply call the enhanced version
  RETURN public.advance_winner_to_next_round_enhanced(p_match_id, p_force_advance);
END;
$$;

-- 3. Enhance the auto-advancement trigger function
CREATE OR REPLACE FUNCTION public.trigger_advance_tournament_winner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only trigger on matches that have been completed with a winner
  -- And the winner was just set (changed from NULL or different winner)
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Log the trigger execution
    RAISE NOTICE 'Auto-advancing winner % for match % in tournament %', NEW.winner_id, NEW.id, NEW.tournament_id;
    
    -- Call the advance winner function
    SELECT public.advance_winner_to_next_round_enhanced(NEW.id, FALSE) INTO v_result;
    
    -- Log the result for debugging
    RAISE NOTICE 'Advancement result: %', v_result;
    
    -- Insert automation log for monitoring
    INSERT INTO public.tournament_automation_log (
      tournament_id, match_id, automation_type, status, details, completed_at
    ) VALUES (
      NEW.tournament_id, NEW.id, 'auto_winner_advancement', 
      CASE WHEN (v_result->>'success')::boolean THEN 'completed' ELSE 'failed' END,
      v_result, NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Enhanced tournament completion trigger function
CREATE OR REPLACE FUNCTION public.check_tournament_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  -- Check if the final match (round_number = max, match_number = 1, not third place) is completed with a winner
  SELECT 
    (status = 'completed' AND winner_id IS NOT NULL),
    winner_id
  INTO v_final_match_completed, v_champion_id
  FROM tournament_matches 
  WHERE tournament_id = NEW.tournament_id 
  AND round_number = v_final_round 
  AND match_number = 1
  AND (is_third_place_match IS NULL OR is_third_place_match = false);
  
  -- If final match is completed, mark tournament as completed
  IF v_final_match_completed THEN
    UPDATE tournaments 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.tournament_id
    AND status != 'completed';
    
    RAISE NOTICE 'Tournament % automatically completed - champion: %', NEW.tournament_id, v_champion_id;
    
    -- Log tournament completion
    INSERT INTO public.tournament_automation_log (
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
    
    -- Process tournament completion (award points, etc.)
    PERFORM public.process_tournament_completion(NEW.tournament_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Enhanced notification trigger function
CREATE OR REPLACE FUNCTION public.notify_winner_advancement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send real-time notification for winner advancement
  IF NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    PERFORM pg_notify(
      'winner_advancement', 
      json_build_object(
        'tournament_id', NEW.tournament_id,
        'match_id', NEW.id,
        'winner_id', NEW.winner_id,
        'round', NEW.round_number,
        'match_number', NEW.match_number,
        'status', NEW.status,
        'timestamp', NOW()
      )::text
    );
    
    -- Also send tournament update notification
    PERFORM pg_notify(
      'tournament_update',
      json_build_object(
        'tournament_id', NEW.tournament_id,
        'type', 'match_completed',
        'match_id', NEW.id,
        'winner_id', NEW.winner_id,
        'timestamp', NOW()
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS trigger_auto_advance_winner ON public.tournament_matches;
DROP TRIGGER IF EXISTS trigger_auto_advance_on_completion ON public.tournament_matches;
DROP TRIGGER IF EXISTS trigger_check_tournament_completion ON public.tournament_matches;
DROP TRIGGER IF EXISTS trigger_notify_winner_advancement ON public.tournament_matches;

-- 7. Create all essential triggers
CREATE TRIGGER trigger_auto_advance_winner
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_advance_tournament_winner();

CREATE TRIGGER trigger_check_tournament_completion
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.check_tournament_completion();

CREATE TRIGGER trigger_notify_winner_advancement
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_winner_advancement();

-- 8. Create missing functions that are referenced in the code

-- Fix all tournament progression function
CREATE OR REPLACE FUNCTION public.fix_all_tournament_progression(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
  v_fixed_count INTEGER := 0;
  v_errors TEXT[] := '{}';
  v_result JSONB;
BEGIN
  -- Get all completed matches with winners that need advancement
  FOR v_match IN
    SELECT * FROM tournament_matches
    WHERE tournament_id = p_tournament_id
    AND status = 'completed'
    AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    BEGIN
      -- Try to advance the winner
      SELECT public.advance_winner_to_next_round_enhanced(v_match.id, TRUE) INTO v_result;
      
      IF (v_result->>'success')::boolean THEN
        v_fixed_count := v_fixed_count + 1;
      ELSE
        v_errors := v_errors || format('Match %s: %s', v_match.id, v_result->>'error');
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || format('Match %s: %s', v_match.id, SQLERRM);
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'fixed_matches', v_fixed_count,
    'errors', v_errors
  );
END;
$$;

-- Force start tournament function
CREATE OR REPLACE FUNCTION public.force_start_tournament(p_tournament_id uuid, p_admin_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update tournament to ongoing status and current time
  UPDATE tournaments 
  SET status = 'ongoing',
      tournament_start = NOW(),
      updated_at = NOW()
  WHERE id = p_tournament_id;
  
  -- Generate bracket if not exists
  PERFORM public.generate_complete_tournament_bracket(p_tournament_id);
  
  -- Log the force start
  INSERT INTO public.tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    p_tournament_id, 'force_start', 'completed',
    jsonb_build_object(
      'admin_id', p_admin_id,
      'force_start_time', NOW()
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'status', 'ongoing',
    'started_at', NOW()
  );
END;
$$;

-- Challenge completion with bonuses
CREATE OR REPLACE FUNCTION public.complete_challenge_match_with_bonuses(
  p_match_id uuid, 
  p_winner_id uuid, 
  p_loser_id uuid, 
  p_wager_points integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_winner_points INTEGER;
  v_loser_points INTEGER;
  v_daily_count INTEGER;
  v_multiplier NUMERIC;
BEGIN
  -- Check daily challenge count for multiplier
  SELECT COALESCE(COUNT(*), 0) INTO v_daily_count
  FROM spa_points_log
  WHERE user_id = p_winner_id 
  AND category = 'challenge'
  AND created_at >= CURRENT_DATE;

  -- Apply multiplier based on daily count
  IF v_daily_count >= 2 THEN
    v_multiplier := 0.3;
  ELSE
    v_multiplier := 1.0;
  END IF;

  -- Calculate points
  v_winner_points := ROUND(p_wager_points * v_multiplier);
  v_loser_points := ROUND(-p_wager_points * 0.5 * v_multiplier);

  -- Update player rankings and log points
  PERFORM public.complete_challenge_match(p_match_id, p_winner_id, p_loser_id, p_wager_points);

  RETURN jsonb_build_object(
    'success', true,
    'winner_points', v_winner_points,
    'loser_points', v_loser_points,
    'multiplier', v_multiplier,
    'daily_count', v_daily_count
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.advance_winner_to_next_round(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_winner_to_next_round_enhanced(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_all_tournament_progression(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_start_tournament(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_challenge_match_with_bonuses(UUID, UUID, UUID, INTEGER) TO authenticated;

-- Enable realtime for key tables
ALTER TABLE public.tournament_matches REPLICA IDENTITY FULL;
ALTER TABLE public.tournaments REPLICA IDENTITY FULL;
ALTER TABLE public.tournament_automation_log REPLICA IDENTITY FULL;
