-- ===============================================
-- ENHANCED TOURNAMENT AUTOMATION SYSTEM
-- Tạo hệ thống triggers đầy đủ cho Double Elimination
-- ===============================================

-- 1. Function để auto-advance winner khi có match completed
CREATE OR REPLACE FUNCTION public.auto_advance_tournament_winner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_advancement_result JSONB;
BEGIN
  -- Chỉ xử lý khi match vừa được completed và có winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.status != 'completed' OR OLD.winner_id IS NULL) THEN
    
    -- Log automation trigger
    INSERT INTO public.tournament_automation_log (
      tournament_id, automation_type, status, details, created_at
    ) VALUES (
      NEW.tournament_id, 'auto_advancement_trigger', 'processing',
      jsonb_build_object(
        'match_id', NEW.id,
        'match_round', NEW.round_number,
        'winner_id', NEW.winner_id
      ),
      NOW()
    );
    
    -- Gọi function auto-advance
    BEGIN
      SELECT public.advance_winner_to_next_round_enhanced(NEW.id, false) INTO v_advancement_result;
      
      -- Log kết quả thành công
      INSERT INTO public.tournament_automation_log (
        tournament_id, automation_type, status, details, completed_at
      ) VALUES (
        NEW.tournament_id, 'auto_advancement', 'completed',
        v_advancement_result,
        NOW()
      );
      
      -- Update automation trigger log
      UPDATE public.tournament_automation_log 
      SET status = 'completed', completed_at = NOW()
      WHERE tournament_id = NEW.tournament_id 
        AND automation_type = 'auto_advancement_trigger'
        AND details->>'match_id' = NEW.id::text
        AND status = 'processing';
        
    EXCEPTION WHEN OTHERS THEN
      -- Log lỗi advancement
      INSERT INTO public.tournament_automation_log (
        tournament_id, automation_type, status, error_message, created_at
      ) VALUES (
        NEW.tournament_id, 'auto_advancement', 'failed',
        SQLERRM, NOW()
      );
      
      -- Update automation trigger log
      UPDATE public.tournament_automation_log 
      SET status = 'failed', error_message = SQLERRM
      WHERE tournament_id = NEW.tournament_id 
        AND automation_type = 'auto_advancement_trigger'
        AND details->>'match_id' = NEW.id::text
        AND status = 'processing';
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Tạo trigger cho auto-advancement
DROP TRIGGER IF EXISTS trigger_auto_advance_winner ON public.tournament_matches;
CREATE TRIGGER trigger_auto_advance_winner
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_advance_tournament_winner();

-- 3. Function để auto-complete tournament khi final match xong
CREATE OR REPLACE FUNCTION public.auto_complete_tournament()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_final_round INTEGER;
  v_tournament_status TEXT;
BEGIN
  -- Chỉ xử lý khi match vừa được completed
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.status != 'completed' OR OLD.winner_id IS NULL) THEN
    
    -- Kiểm tra tournament status
    SELECT status INTO v_tournament_status
    FROM public.tournaments 
    WHERE id = NEW.tournament_id;
    
    -- Chỉ xử lý tournament đang ongoing
    IF v_tournament_status = 'ongoing' THEN
      -- Tìm final round
      SELECT MAX(round_number) INTO v_final_round
      FROM public.tournament_matches 
      WHERE tournament_id = NEW.tournament_id;
      
      -- Nếu đây là trận chung kết (round cao nhất, match 1)
      IF NEW.round_number = v_final_round AND NEW.match_number = 1 THEN
        -- Complete tournament
        UPDATE public.tournaments 
        SET status = 'completed',
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.tournament_id;
        
        -- Log tournament completion
        INSERT INTO public.tournament_automation_log (
          tournament_id, automation_type, status, details, completed_at
        ) VALUES (
          NEW.tournament_id, 'tournament_completion', 'completed',
          jsonb_build_object(
            'champion_id', NEW.winner_id,
            'final_match_id', NEW.id,
            'completion_trigger', 'final_match_completed'
          ),
          NOW()
        );
        
        -- Process tournament results
        PERFORM public.process_tournament_completion(NEW.tournament_id);
        
        RAISE NOTICE 'Tournament % automatically completed - champion: %', NEW.tournament_id, NEW.winner_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Tạo trigger cho tournament completion
DROP TRIGGER IF EXISTS trigger_auto_complete_tournament ON public.tournament_matches;
CREATE TRIGGER trigger_auto_complete_tournament
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_tournament();

-- 5. Function để auto-advance to semifinal/final nếu cần
CREATE OR REPLACE FUNCTION public.auto_advance_to_next_phase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_semifinal_result JSONB;
  v_final_result JSONB;
BEGIN
  -- Chỉ xử lý khi match vừa được completed
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.status != 'completed' OR OLD.winner_id IS NULL) THEN
    
    -- Thử auto-advance to semifinal
    BEGIN
      SELECT public.auto_advance_to_semifinal(NEW.tournament_id) INTO v_semifinal_result;
      
      IF v_semifinal_result->>'success' = 'true' THEN
        INSERT INTO public.tournament_automation_log (
          tournament_id, automation_type, status, details, completed_at
        ) VALUES (
          NEW.tournament_id, 'semifinal_advancement', 'completed',
          v_semifinal_result, NOW()
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Không log lỗi vì có thể semifinal không cần thiết
      NULL;
    END;
    
    -- Thử auto-advance to final
    BEGIN
      SELECT public.auto_advance_to_final(NEW.tournament_id) INTO v_final_result;
      
      IF v_final_result->>'success' = 'true' THEN
        INSERT INTO public.tournament_automation_log (
          tournament_id, automation_type, status, details, completed_at
        ) VALUES (
          NEW.tournament_id, 'final_advancement', 'completed',
          v_final_result, NOW()
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Không log lỗi vì có thể final không cần thiết
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Tạo trigger cho phase advancement
DROP TRIGGER IF EXISTS trigger_auto_advance_phase ON public.tournament_matches;
CREATE TRIGGER trigger_auto_advance_phase
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_advance_to_next_phase();

-- 7. Function để check trigger status
CREATE OR REPLACE FUNCTION public.check_tournament_triggers_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_triggers RECORD;
  v_active_triggers INTEGER := 0;
  v_trigger_list JSONB[] := '{}';
BEGIN
  FOR v_triggers IN
    SELECT 
      trigger_name,
      event_manipulation,
      action_timing,
      action_statement
    FROM information_schema.triggers 
    WHERE event_object_table = 'tournament_matches'
    AND trigger_schema = 'public'
    ORDER BY trigger_name
  LOOP
    v_active_triggers := v_active_triggers + 1;
    v_trigger_list := v_trigger_list || jsonb_build_object(
      'name', v_triggers.trigger_name,
      'event', v_triggers.event_manipulation,
      'timing', v_triggers.action_timing,
      'function', v_triggers.action_statement
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'active_triggers', v_active_triggers,
    'triggers', v_trigger_list,
    'status', CASE WHEN v_active_triggers >= 3 THEN 'complete' ELSE 'incomplete' END,
    'checked_at', NOW()
  );
END;
$$;