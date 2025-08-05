-- Truy vấn lịch sử tham gia giải đấu và điểm ELO đã nhận của user
-- Thay thế 'USER_ID_HERE' bằng ID thực của user cần kiểm tra

-- 1. Tổng quan về tất cả các giải đấu đã tham gia và ELO nhận được
SELECT 
  COUNT(*) as total_tournaments,
  SUM(elo_points_earned) as total_elo_earned,
  SUM(spa_points_earned) as total_spa_earned,
  COUNT(CASE WHEN final_position = 1 THEN 1 END) as championships,
  COUNT(CASE WHEN final_position = 2 THEN 1 END) as runner_ups,
  COUNT(CASE WHEN final_position <= 3 THEN 1 END) as top_3_finishes,
  AVG(final_position) as average_position
FROM tournament_results 
WHERE user_id = 'USER_ID_HERE';

-- 2. Chi tiết từng giải đấu đã tham gia
SELECT 
  tr.id,
  t.name as tournament_name,
  tr.final_position,
  tr.matches_played,
  tr.matches_won,
  tr.matches_lost,
  tr.spa_points_earned,
  tr.elo_points_earned,
  tr.prize_amount,
  tr.created_at,
  t.start_date as tournament_date
FROM tournament_results tr
LEFT JOIN tournaments t ON tr.tournament_id = t.id
WHERE tr.user_id = 'USER_ID_HERE'
ORDER BY tr.created_at DESC;

-- 3. Kiểm tra các giải đấu gần nhất với ELO cao nhất
SELECT 
  t.name as tournament_name,
  tr.final_position,
  tr.elo_points_earned,
  tr.spa_points_earned,
  tr.created_at
FROM tournament_results tr
LEFT JOIN tournaments t ON tr.tournament_id = t.id
WHERE tr.user_id = 'USER_ID_HERE'
  AND tr.elo_points_earned > 0
ORDER BY tr.elo_points_earned DESC, tr.created_at DESC
LIMIT 10;

-- 4. ELO từ các vị trí khác nhau
SELECT 
  CASE 
    WHEN final_position = 1 THEN 'Champion'
    WHEN final_position = 2 THEN 'Runner-up'
    WHEN final_position = 3 THEN '3rd Place'
    WHEN final_position <= 8 THEN 'Top 8'
    ELSE 'Other'
  END as position_category,
  COUNT(*) as times_achieved,
  SUM(elo_points_earned) as total_elo_from_position,
  AVG(elo_points_earned) as avg_elo_per_tournament
FROM tournament_results 
WHERE user_id = 'USER_ID_HERE'
GROUP BY 
  CASE 
    WHEN final_position = 1 THEN 'Champion'
    WHEN final_position = 2 THEN 'Runner-up'
    WHEN final_position = 3 THEN '3rd Place'
    WHEN final_position <= 8 THEN 'Top 8'
    ELSE 'Other'
  END
ORDER BY total_elo_from_position DESC;

-- 5. Thống kê ELO theo thời gian (6 tháng gần nhất)
SELECT 
  DATE_TRUNC('month', tr.created_at) as month,
  COUNT(*) as tournaments_in_month,
  SUM(tr.elo_points_earned) as total_elo_in_month,
  AVG(tr.final_position) as avg_position_in_month
FROM tournament_results tr
WHERE tr.user_id = 'USER_ID_HERE'
  AND tr.created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', tr.created_at)
ORDER BY month DESC;

-- 6. So sánh với người chơi khác (ranking theo total ELO earned)
WITH user_elo_ranking AS (
  SELECT 
    user_id,
    SUM(elo_points_earned) as total_elo_earned,
    COUNT(*) as total_tournaments,
    ROW_NUMBER() OVER (ORDER BY SUM(elo_points_earned) DESC) as elo_rank
  FROM tournament_results
  WHERE elo_points_earned > 0
  GROUP BY user_id
)
SELECT 
  uer.elo_rank,
  uer.total_elo_earned,
  uer.total_tournaments,
  p.full_name,
  p.display_name
FROM user_elo_ranking uer
LEFT JOIN profiles p ON uer.user_id = p.user_id
WHERE uer.user_id = 'USER_ID_HERE';

-- 7. Kiểm tra ELO history từ bảng elo_history (nếu có)
SELECT 
  eh.created_at,
  eh.elo_change,
  eh.new_elo,
  eh.reason,
  t.name as tournament_name
FROM elo_history eh
LEFT JOIN tournaments t ON eh.tournament_id = t.id
WHERE eh.user_id = 'USER_ID_HERE'
  AND eh.elo_change > 0
ORDER BY eh.created_at DESC
LIMIT 20;
