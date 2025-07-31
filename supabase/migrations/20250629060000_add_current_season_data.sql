-- Add current season data (2025-S2)
-- Season: 2025-S2 (Second season of 2025)
-- Start: 01/06/2025, End: 30/09/2025
-- Status: Ongoing

INSERT INTO season_history (season_name, season_year, nickname, ranking_points, final_rank) VALUES
('S2', 2025, 'ĐĂNG RT', 3600, 1),
('S2', 2025, 'KHÁNH HOÀNG', 3500, 2),
('S2', 2025, 'THÙY LINH', 3450, 3),
('S2', 2025, 'BEN SABO', 2300, 4),
('S2', 2025, 'TRƯỜNG PHÚC', 2300, 5),
('S2', 2025, 'HUY HÙNG', 2100, 6),
('S2', 2025, 'BI SỨA', 2050, 7),
('S2', 2025, 'LỌ LEM', 1650, 8),
('S2', 2025, 'BẰNG NHIỆT', 1550, 9),
('S2', 2025, 'THÀNH', 1450, 10),
('S2', 2025, 'NGÔ LỚN', 1200, 11),
('S2', 2025, 'HẢI BÉ', 1150, 12),
('S2', 2025, 'VIỆT NHÍM', 1100, 13),
('S2', 2025, 'ĐẶNG THỦY', 1100, 14),
('S2', 2025, 'QUỐC MINH', 500, 15),
('S2', 2025, 'KHÁ NGUYỄN', 500, 16),
('S2', 2025, 'NAM DƯƠNG', 500, 17),
('S2', 2025, 'LÊ VƯƠNG', 350, 18),
('S2', 2025, 'MAI MÈO', 300, 19),
('S2', 2025, 'ANH QUÂN', 300, 20),
('S2', 2025, 'CHỊ DUNG', 150, 21),
('S2', 2025, 'NHÂN LÊ', 150, 22),
('S2', 2025, 'HIẾU NGUYỄN', 150, 23),
('S2', 2025, 'KEN', 150, 24),
('S2', 2025, 'NGHIÊM', 150, 25),
('S2', 2025, 'QUANG NHẬT', 150, 26),
('S2', 2025, 'DUY NGUYỄN', 150, 27),
('S2', 2025, 'ĐÌNH DŨNG', 150, 28),
('S2', 2025, 'HUY TRAN', 150, 29),
('S2', 2025, 'MINH', 150, 30),
('S2', 2025, 'NGUYÊN', 150, 31),
('S2', 2025, 'PHÚC NHỎ', 150, 32),
('S2', 2025, 'TIẾN BỊP', 150, 33),
('S2', 2025, 'TIẾN LƯƠNG', 150, 34),
('S2', 2025, 'TN.MINH ĐỨC', 150, 35),
('S2', 2025, 'TUẤN PHONG', 150, 36),
('S2', 2025, 'THANH', 150, 37),
('S2', 2025, 'QUỐC EM', 150, 38),
('S2', 2025, 'LIÊM CON', 150, 39),
('S2', 2025, 'MINH', 150, 40),
('S2', 2025, 'VIỆT ANH', 150, 41),
('S2', 2025, 'TUẤN', 150, 42),
('S2', 2025, 'TUÂN XÍ LỤM', 150, 43),
('S2', 2025, 'NHẬT LONG', 150, 44),
('S2', 2025, 'HOÀNG LONG', 150, 45);

-- Create a table to track current season status
CREATE TABLE IF NOT EXISTS current_season (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_name TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ongoing', -- 'ongoing', 'completed', 'upcoming'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert current season info
INSERT INTO current_season (season_name, season_year, start_date, end_date, status) VALUES
('S2', 2025, '2025-06-01', '2025-09-30', 'ongoing');

-- Create a function to get current season info
CREATE OR REPLACE FUNCTION get_current_season()
RETURNS TABLE (
  season_name TEXT,
  season_year INTEGER,
  start_date DATE,
  end_date DATE,
  status TEXT,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.season_name,
    cs.season_year,
    cs.start_date,
    cs.end_date,
    cs.status,
    CASE 
      WHEN cs.end_date >= CURRENT_DATE THEN 
        cs.end_date::date - CURRENT_DATE
      ELSE 0
    END as days_remaining
  FROM current_season cs
  WHERE cs.status = 'ongoing'
  ORDER BY cs.season_year DESC, cs.season_name DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get season progress
CREATE OR REPLACE FUNCTION get_season_progress(season_name TEXT, season_year INTEGER)
RETURNS TABLE (
  total_days INTEGER,
  days_elapsed INTEGER,
  days_remaining INTEGER,
  progress_percentage NUMERIC
) AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  current_date DATE := CURRENT_DATE;
BEGIN
  SELECT cs.start_date, cs.end_date 
  INTO start_date, end_date
  FROM current_season cs
  WHERE cs.season_name = $1 AND cs.season_year = $2;
  
  IF start_date IS NULL OR end_date IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    (end_date - start_date + 1)::INTEGER as total_days,
    CASE 
      WHEN current_date >= start_date THEN 
        (current_date - start_date + 1)::INTEGER
      ELSE 0
    END as days_elapsed,
    CASE 
      WHEN current_date <= end_date THEN 
        (end_date - current_date)::INTEGER
      ELSE 0
    END as days_remaining,
    CASE 
      WHEN (end_date - start_date + 1) > 0 THEN
        ROUND(
          (CASE 
            WHEN current_date >= start_date THEN 
              (current_date - start_date + 1)
            ELSE 0
          END::NUMERIC / (end_date - start_date + 1)::NUMERIC) * 100, 2
        )
      ELSE 0
    END as progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Verify the data was inserted correctly
SELECT 
  'Current Season Data Added' as status,
  COUNT(*) as total_players,
  MIN(final_rank) as min_rank,
  MAX(final_rank) as max_rank,
  MIN(ranking_points) as min_points,
  MAX(ranking_points) as max_points
FROM season_history 
WHERE season_name = 'S2' AND season_year = 2025; 