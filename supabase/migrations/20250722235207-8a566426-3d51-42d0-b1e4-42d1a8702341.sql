-- Thêm trigger tự động gọi complete_tournament_automatically sau khi tournament hoàn thành
CREATE OR REPLACE FUNCTION public.auto_complete_tournament_results()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Chỉ chạy khi tournament chuyển sang completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Gọi function tính toán kết quả tự động
    SELECT public.complete_tournament_automatically(NEW.id) INTO v_result;
    
    -- Log kết quả
    INSERT INTO public.tournament_automation_log (
      tournament_id, automation_type, status, details, completed_at
    ) VALUES (
      NEW.id, 'auto_results_calculation', 
      CASE WHEN (v_result->>'success')::boolean THEN 'completed' ELSE 'failed' END,
      v_result, NOW()
    );
    
    RAISE NOTICE 'Auto tournament results calculation for %: %', NEW.id, v_result;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Tạo trigger
DROP TRIGGER IF EXISTS trigger_auto_complete_tournament_results ON tournaments;
CREATE TRIGGER trigger_auto_complete_tournament_results
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_tournament_results();

-- Chạy tính toán kết quả cho các tournament đã hoàn thành nhưng chưa có kết quả
DO $$
DECLARE
  v_tournament RECORD;
  v_result JSONB;
BEGIN
  FOR v_tournament IN
    SELECT t.id, t.name, t.status
    FROM tournaments t
    WHERE t.status = 'completed'
      AND NOT EXISTS (
        SELECT 1 FROM tournament_results tr 
        WHERE tr.tournament_id = t.id
      )
  LOOP
    -- Gọi function tính toán kết quả
    SELECT public.complete_tournament_automatically(v_tournament.id) INTO v_result;
    
    RAISE NOTICE 'Calculating results for completed tournament %: %', v_tournament.name, v_result;
  END LOOP;
END;
$$;