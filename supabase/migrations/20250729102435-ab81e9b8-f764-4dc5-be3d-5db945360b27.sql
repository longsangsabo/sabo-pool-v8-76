-- Tạo lại triggers V9 cho tournament_matches

-- Xóa triggers cũ nếu có
DROP TRIGGER IF EXISTS auto_advance_double_elimination_v9 ON public.tournament_matches;
DROP TRIGGER IF EXISTS notify_winner_advancement_v9 ON public.tournament_matches;
DROP TRIGGER IF EXISTS check_tournament_completion_v9 ON public.tournament_matches;

-- 1. Trigger tự động advance khi có winner
CREATE TRIGGER auto_advance_double_elimination_v9
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  WHEN (NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id))
  EXECUTE FUNCTION public.trigger_advance_double_elimination_v9();

-- 2. Trigger thông báo real-time cho winner advancement  
CREATE TRIGGER notify_winner_advancement_v9
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  WHEN (NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.winner_id != NEW.winner_id))
  EXECUTE FUNCTION public.notify_winner_advancement();

-- 3. Trigger kiểm tra hoàn thành tournament
CREATE TRIGGER check_tournament_completion_v9
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW  
  WHEN (NEW.status = 'completed' AND NEW.winner_id IS NOT NULL)
  EXECUTE FUNCTION public.check_tournament_completion();