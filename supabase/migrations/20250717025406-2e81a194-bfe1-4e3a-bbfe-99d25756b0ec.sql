-- Reset tỷ số cho giải đấu "Bảng đấu SABO OPEN TOURNAMENT – Pool 9 Ball (hạng H - I - K)"
UPDATE tournament_matches 
SET 
  score_player1 = NULL,
  score_player2 = NULL,
  winner_id = NULL,
  status = 'scheduled',
  actual_start_time = NULL,
  actual_end_time = NULL,
  updated_at = NOW()
WHERE tournament_id IN (
  SELECT id 
  FROM tournaments 
  WHERE name = 'Bảng đấu SABO OPEN TOURNAMENT – Pool 9 Ball (hạng H - I - K)'
);