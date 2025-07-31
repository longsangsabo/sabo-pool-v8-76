-- Kiểm tra và sửa Championship Final cho double4
-- Trước tiên, hãy xem cấu trúc hiện tại

-- Kiểm tra tournament double4
SELECT 
  'Tournament Info' as type,
  id, name, status
FROM tournaments 
WHERE name ILIKE '%double4%';

-- Kiểm tra tất cả matches và tìm winners
WITH tournament_id AS (
  SELECT id FROM tournaments WHERE name ILIKE '%double4%' LIMIT 1
),
all_matches AS (
  SELECT 
    tm.id, tm.round_number, tm.match_number, tm.bracket_type, tm.match_stage,
    tm.player1_id, tm.player2_id, tm.winner_id, tm.status,
    p1.full_name as player1_name,
    p2.full_name as player2_name,
    pw.full_name as winner_name
  FROM tournament_matches tm
  JOIN tournament_id ti ON tm.tournament_id = ti.id
  LEFT JOIN profiles p1 ON tm.player1_id = p1.user_id
  LEFT JOIN profiles p2 ON tm.player2_id = p2.user_id
  LEFT JOIN profiles pw ON tm.winner_id = pw.user_id
  ORDER BY tm.round_number DESC, tm.match_number
)
SELECT * FROM all_matches;

-- Tìm Winners Bracket Final và Losers Bracket Final
WITH tournament_id AS (
  SELECT id FROM tournaments WHERE name ILIKE '%double4%' LIMIT 1
),
winners_final AS (
  -- Tìm trận cuối cùng của Winners Bracket (round cao nhất không phải losers)
  SELECT winner_id, 'Winners Bracket Final' as source
  FROM tournament_matches tm
  JOIN tournament_id ti ON tm.tournament_id = ti.id
  WHERE tm.bracket_type IN ('winner', 'winners', 'single_elimination')
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
    AND tm.round_number = (
      SELECT MAX(round_number) 
      FROM tournament_matches tm2 
      WHERE tm2.tournament_id = ti.id 
      AND tm2.bracket_type IN ('winner', 'winners', 'single_elimination')
      AND tm2.status = 'completed'
    )
  LIMIT 1
),
losers_final AS (
  -- Tìm trận cuối cùng của Losers Bracket (round cao nhất của losers)
  SELECT winner_id, 'Losers Bracket Final' as source
  FROM tournament_matches tm
  JOIN tournament_id ti ON tm.tournament_id = ti.id
  WHERE tm.bracket_type IN ('loser', 'losers')
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
    AND tm.round_number = (
      SELECT MAX(round_number) 
      FROM tournament_matches tm2 
      WHERE tm2.tournament_id = ti.id 
      AND tm2.bracket_type IN ('loser', 'losers')
      AND tm2.status = 'completed'
    )
  LIMIT 1
)
SELECT * FROM winners_final
UNION ALL
SELECT * FROM losers_final;