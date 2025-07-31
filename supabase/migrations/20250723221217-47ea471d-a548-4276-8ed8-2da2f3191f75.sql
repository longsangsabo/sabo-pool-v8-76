-- ============================================
-- PHASE 5: ENABLE ALL AUTOMATION & TRIGGERS
-- ============================================

-- 1. Create enhanced tournament completion trigger
CREATE OR REPLACE FUNCTION public.enhanced_tournament_completion_trigger()
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
  v_tournament_type TEXT;
BEGIN
  -- Get current tournament status and type
  SELECT status, tournament_type INTO v_tournament_status, v_tournament_type
  FROM tournaments 
  WHERE id = NEW.tournament_id;
  
  -- Only check completion for ongoing tournaments
  IF v_tournament_status != 'ongoing' THEN
    RETURN NEW;
  END IF;
  
  -- Handle different tournament types
  IF v_tournament_type = 'double_elimination' THEN
    -- For double elimination: check grand final
    SELECT 
      (status = 'completed' AND winner_id IS NOT NULL),
      winner_id
    INTO v_final_match_completed, v_champion_id
    FROM tournament_matches 
    WHERE tournament_id = NEW.tournament_id 
    AND bracket_type = 'grand_final';
  ELSE
    -- For single elimination: check final round
    SELECT MAX(round_number) INTO v_final_round
    FROM tournament_matches 
    WHERE tournament_id = NEW.tournament_id;
    
    SELECT 
      (status = 'completed' AND winner_id IS NOT NULL),
      winner_id
    INTO v_final_match_completed, v_champion_id
    FROM tournament_matches 
    WHERE tournament_id = NEW.tournament_id 
    AND round_number = v_final_round 
    AND match_number = 1
    AND (is_third_place_match IS NULL OR is_third_place_match = false);
  END IF;
  
  -- If final match is completed, mark tournament as completed
  IF v_final_match_completed THEN
    UPDATE tournaments 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.tournament_id
    AND status != 'completed';
    
    -- Log tournament completion
    INSERT INTO public.tournament_automation_log (
      tournament_id, automation_type, status, details, completed_at
    ) VALUES (
      NEW.tournament_id, 'tournament_completion', 'completed',
      jsonb_build_object(
        'champion_id', v_champion_id,
        'completion_trigger', 'final_match_completed',
        'final_match_id', NEW.id,
        'tournament_type', v_tournament_type
      ),
      NOW()
    );
    
    -- Process tournament completion (award points, etc.)
    PERFORM public.process_tournament_completion(NEW.tournament_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Create enhanced winner advancement trigger
CREATE OR REPLACE FUNCTION public.enhanced_winner_advancement_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only trigger on matches that have been completed with a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id) THEN
    
    -- Call the enhanced advance winner function
    SELECT public.advance_winner_to_next_round_enhanced(NEW.id, FALSE) INTO v_result;
    
    -- Insert automation log for monitoring
    INSERT INTO public.tournament_automation_log (
      tournament_id, match_id, automation_type, status, details, completed_at
    ) VALUES (
      NEW.tournament_id, NEW.id, 'auto_winner_advancement', 
      CASE WHEN (v_result->>'success')::boolean THEN 'completed' ELSE 'failed' END,
      v_result, NOW()
    );
    
    -- Send real-time notification
    PERFORM pg_notify(
      'winner_advancement', 
      json_build_object(
        'tournament_id', NEW.tournament_id,
        'match_id', NEW.id,
        'winner_id', NEW.winner_id,
        'round', NEW.round_number,
        'match_number', NEW.match_number,
        'status', NEW.status,
        'bracket_type', NEW.bracket_type,
        'timestamp', NOW()
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Drop existing triggers and create new ones
DROP TRIGGER IF EXISTS check_tournament_completion ON tournament_matches;
DROP TRIGGER IF EXISTS trigger_advance_tournament_winner ON tournament_matches;
DROP TRIGGER IF EXISTS trigger_auto_advance_winner ON tournament_matches;
DROP TRIGGER IF EXISTS notify_winner_advancement ON tournament_matches;

-- Create comprehensive tournament automation trigger
CREATE TRIGGER enhanced_tournament_automation
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION enhanced_winner_advancement_trigger();

-- Create enhanced tournament completion trigger
CREATE TRIGGER enhanced_tournament_completion
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION enhanced_tournament_completion_trigger();

-- 4. Create missing progression functions
CREATE OR REPLACE FUNCTION public.fix_all_tournament_progression(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_fixed_count INTEGER := 0;
  v_errors TEXT[] := '{}';
  v_result JSONB;
BEGIN
  -- Find completed matches with winners but no progression
  FOR v_match IN
    SELECT * FROM tournament_matches
    WHERE tournament_id = p_tournament_id
    AND status = 'completed'
    AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    BEGIN
      -- Try to advance the winner
      SELECT public.advance_winner_to_next_round_enhanced(v_match.id, true) INTO v_result;
      
      IF (v_result->>'success')::boolean THEN
        v_fixed_count := v_fixed_count + 1;
      ELSE
        v_errors := v_errors || (v_result->>'error')::text;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || SQLERRM;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'fixed_matches', v_fixed_count,
    'errors', v_errors,
    'fixed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 5. Create process tournament completion function
CREATE OR REPLACE FUNCTION public.process_tournament_completion(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_champion RECORD;
  v_participants INTEGER;
  v_points_awarded INTEGER := 0;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get champion info
  IF v_tournament.tournament_type = 'double_elimination' THEN
    SELECT tm.winner_id INTO v_champion
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id 
    AND tm.bracket_type = 'grand_final'
    AND tm.status = 'completed';
  ELSE
    SELECT tm.winner_id INTO v_champion
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id 
    AND tm.round_number = (
      SELECT MAX(round_number) FROM tournament_matches 
      WHERE tournament_id = p_tournament_id
    )
    AND tm.match_number = 1
    AND tm.status = 'completed';
  END IF;
  
  -- Get participant count
  SELECT COUNT(*) INTO v_participants
  FROM tournament_registrations
  WHERE tournament_id = p_tournament_id
  AND registration_status = 'confirmed';
  
  -- Award SPA points to champion
  IF v_champion.winner_id IS NOT NULL THEN
    v_points_awarded := CASE 
      WHEN v_participants >= 32 THEN 500
      WHEN v_participants >= 16 THEN 300
      WHEN v_participants >= 8 THEN 200
      ELSE 100
    END;
    
    -- Update player rankings
    UPDATE player_rankings
    SET spa_points = spa_points + v_points_awarded,
        tournaments_won = tournaments_won + 1,
        updated_at = NOW()
    WHERE user_id = v_champion.winner_id;
    
    -- Log points
    INSERT INTO spa_points_log (user_id, points_earned, category, description)
    VALUES (v_champion.winner_id, v_points_awarded, 'tournament', 
            'Tournament champion: ' || v_tournament.name);
  END IF;
  
  -- Send completion notifications
  INSERT INTO notifications (user_id, title, message, type, metadata)
  SELECT 
    tr.user_id,
    'Tournament Completed!',
    CASE 
      WHEN tr.user_id = v_champion.winner_id THEN 
        'Congratulations! You won ' || v_tournament.name || ' and earned ' || v_points_awarded || ' SPA points!'
      ELSE 
        'Tournament ' || v_tournament.name || ' has been completed. Thank you for participating!'
    END,
    'tournament',
    jsonb_build_object(
      'tournament_id', p_tournament_id,
      'tournament_name', v_tournament.name,
      'is_champion', tr.user_id = v_champion.winner_id
    )
  FROM tournament_registrations tr
  WHERE tr.tournament_id = p_tournament_id
  AND tr.registration_status = 'confirmed';
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'champion_id', v_champion.winner_id,
    'participants', v_participants,
    'points_awarded', v_points_awarded,
    'processed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;