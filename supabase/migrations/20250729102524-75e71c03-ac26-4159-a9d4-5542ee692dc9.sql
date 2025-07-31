-- Tạo triggers với cú pháp đơn giản cho V9 double elimination

-- Xóa tất cả triggers cũ
DROP TRIGGER IF EXISTS auto_advance_double_elimination_v9 ON tournament_matches;
DROP TRIGGER IF EXISTS notify_winner_advancement_v9 ON tournament_matches; 
DROP TRIGGER IF EXISTS check_tournament_completion_v9 ON tournament_matches;

-- Tạo trigger đơn giản cho auto advance
CREATE TRIGGER auto_advance_double_elimination_v9
  AFTER UPDATE OF winner_id ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_advance_double_elimination_v9();

-- Tạo trigger cho thông báo real-time  
CREATE TRIGGER notify_winner_advancement_v9
  AFTER UPDATE OF winner_id ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_winner_advancement();

-- Tạo trigger cho kiểm tra hoàn thành tournament
CREATE TRIGGER check_tournament_completion_v9
  AFTER UPDATE OF status ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION check_tournament_completion();