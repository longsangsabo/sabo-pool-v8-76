-- Cập nhật Championship Final cho tournament double4
-- Lấy winner từ Winner's Bracket Final (Round 4) và Loser's Bracket Final (Round 251)

-- First, let's check current tournament structure
WITH tournament_info AS (
  SELECT id FROM tournaments WHERE name ILIKE '%double4%' LIMIT 1
),
winners_bracket_final AS (
  SELECT winner_id as wb_winner
  FROM tournament_matches tm, tournament_info ti
  WHERE tm.tournament_id = ti.id 
    AND tm.round_number = 4 
    AND tm.match_number = 1
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
),
losers_bracket_final AS (
  SELECT winner_id as lb_winner
  FROM tournament_matches tm, tournament_info ti
  WHERE tm.tournament_id = ti.id 
    AND tm.round_number = 251 
    AND tm.match_number = 1
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
),
championship_match AS (
  SELECT tm.id as match_id
  FROM tournament_matches tm, tournament_info ti
  WHERE tm.tournament_id = ti.id 
    AND tm.round_number = 300 
    AND tm.match_number = 1
)
-- Cập nhật Championship Final với 2 winners
UPDATE tournament_matches 
SET 
  player1_id = (SELECT wb_winner FROM winners_bracket_final),
  player2_id = (SELECT lb_winner FROM losers_bracket_final),
  status = 'scheduled',
  updated_at = NOW()
FROM championship_match, winners_bracket_final, losers_bracket_final
WHERE tournament_matches.id = championship_match.match_id
  AND EXISTS (SELECT 1 FROM winners_bracket_final)
  AND EXISTS (SELECT 1 FROM losers_bracket_final);

-- Thông báo kết quả
SELECT 
  'Championship Final Updated' as result,
  wb.wb_winner as winner_bracket_winner,
  lb.lb_winner as loser_bracket_winner,
  tm.status as final_match_status
FROM tournament_matches tm
JOIN tournaments t ON tm.tournament_id = t.id
CROSS JOIN (SELECT winner_id as wb_winner FROM tournament_matches WHERE tournament_id = (SELECT id FROM tournaments WHERE name ILIKE '%double4%' LIMIT 1) AND round_number = 4 AND match_number = 1 AND status = 'completed') wb
CROSS JOIN (SELECT winner_id as lb_winner FROM tournament_matches WHERE tournament_id = (SELECT id FROM tournaments WHERE name ILIKE '%double4%' LIMIT 1) AND round_number = 251 AND match_number = 1 AND status = 'completed') lb
WHERE t.name ILIKE '%double4%' 
  AND tm.round_number = 300 
  AND tm.match_number = 1;