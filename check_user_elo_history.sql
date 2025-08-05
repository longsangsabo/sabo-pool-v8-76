-- Script để kiểm tra lịch sử ELO của một user cụ thể
-- Chạy trong Supabase SQL Editor hoặc psql

-- Bước 1: Tìm tất cả users có dữ liệu tournament
SELECT DISTINCT 
  tr.user_id,
  p.full_name,
  p.display_name,
  COUNT(tr.id) as tournament_count,
  SUM(tr.elo_points_earned) as total_elo
FROM tournament_results tr
LEFT JOIN profiles p ON tr.user_id = p.user_id
WHERE tr.elo_points_earned > 0
GROUP BY tr.user_id, p.full_name, p.display_name
ORDER BY total_elo DESC
LIMIT 10;

-- Bước 2: Kiểm tra user có nhiều ELO nhất (thay USER_ID ở đây)
-- Lấy USER_ID từ kết quả trên và thay vào đây:

-- VÍ DỤ: Nếu USER_ID là '12345678-1234-1234-1234-123456789abc'
DO $$
DECLARE
    target_user_id UUID := '12345678-1234-1234-1234-123456789abc'; -- THAY ĐỔI USER_ID Ở ĐÂY
    user_name TEXT;
    total_elo INTEGER;
    total_spa INTEGER;
    total_tournaments INTEGER;
BEGIN
    -- Lấy thông tin user
    SELECT 
        COALESCE(p.full_name, p.display_name, 'Unknown User'),
        SUM(tr.elo_points_earned),
        SUM(tr.spa_points_earned),
        COUNT(tr.id)
    INTO user_name, total_elo, total_spa, total_tournaments
    FROM tournament_results tr
    LEFT JOIN profiles p ON tr.user_id = p.user_id
    WHERE tr.user_id = target_user_id;
    
    -- In thông tin tổng quan
    RAISE NOTICE '=== THÔNG TIN USER ===';
    RAISE NOTICE 'User ID: %', target_user_id;
    RAISE NOTICE 'Tên: %', user_name;
    RAISE NOTICE 'Tổng ELO kiếm được: %', total_elo;
    RAISE NOTICE 'Tổng SPA kiếm được: %', total_spa;
    RAISE NOTICE 'Số giải đấu tham gia: %', total_tournaments;
    RAISE NOTICE '';
    
    -- In chi tiết từng giải đấu
    RAISE NOTICE '=== CHI TIẾT CÁC GIẢI ĐẤU ===';
    FOR record IN
        SELECT 
            t.name as tournament_name,
            tr.final_position,
            tr.elo_points_earned,
            tr.spa_points_earned,
            tr.created_at::date
        FROM tournament_results tr
        LEFT JOIN tournaments t ON tr.tournament_id = t.id
        WHERE tr.user_id = target_user_id
        ORDER BY tr.created_at DESC
    LOOP
        RAISE NOTICE 'Giải: % | Vị trí: % | ELO: +% | SPA: +% | Ngày: %', 
            record.tournament_name, 
            record.final_position, 
            record.elo_points_earned, 
            record.spa_points_earned,
            record.created_at;
    END LOOP;
    
END $$;

-- Bước 3: Kiểm tra top 5 users có ELO cao nhất
SELECT 
  p.full_name || ' (' || p.display_name || ')' as player_name,
  tr.user_id,
  SUM(tr.elo_points_earned) as total_elo_earned,
  COUNT(tr.id) as tournaments_played,
  COUNT(CASE WHEN tr.final_position = 1 THEN 1 END) as championships,
  AVG(tr.final_position) as avg_position
FROM tournament_results tr
LEFT JOIN profiles p ON tr.user_id = p.user_id
WHERE tr.elo_points_earned > 0
GROUP BY tr.user_id, p.full_name, p.display_name
ORDER BY total_elo_earned DESC
LIMIT 5;
