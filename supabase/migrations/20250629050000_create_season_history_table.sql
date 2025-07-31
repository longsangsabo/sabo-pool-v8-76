-- Create season_history table to store historical rankings
CREATE TABLE IF NOT EXISTS season_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_name TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  ranking_points INTEGER NOT NULL,
  final_rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique ranking per season per user
  UNIQUE(season_name, season_year, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_season_history_season ON season_history(season_name, season_year);
CREATE INDEX IF NOT EXISTS idx_season_history_user_id ON season_history(user_id);
CREATE INDEX IF NOT EXISTS idx_season_history_rank ON season_history(final_rank);

-- Enable Row Level Security
ALTER TABLE season_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all season history" ON season_history
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert season history" ON season_history
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    )
  );

-- Insert historical data for previous season
-- Season: 2024-S2 (Second season of 2024)
INSERT INTO season_history (season_name, season_year, nickname, ranking_points, final_rank) VALUES
('S2', 2024, 'HẢI BÉ', 13725, 1),
('S2', 2024, 'TUẤN KIỆT', 9700, 2),
('S2', 2024, 'HÙNG FERARRI', 5125, 3),
('S2', 2024, 'KIỆT NASA', 5100, 4),
('S2', 2024, 'ĐỨC MONKEY', 3550, 5),
('S2', 2024, 'KHÁNH HOÀNG', 2800, 6),
('S2', 2024, 'BÉP (boy60)', 2775, 7),
('S2', 2024, 'PH HẬU', 2750, 8),
('S2', 2024, 'DŨNG SAO ĐÊM', 2650, 9),
('S2', 2024, 'VIỆT MỸ', 2425, 10),
('S2', 2024, 'CÔNG NGUYỄN', 2050, 11),
('S2', 2024, 'XÍ LỤM', 1875, 12),
('S2', 2024, 'NVĐ ĐẠT LÊ', 1850, 13),
('S2', 2024, 'BEN SABO', 1650, 14),
('S2', 2024, 'LIÊM CON', 1550, 15),
('S2', 2024, 'TRÍ CAO BỒI', 1350, 16),
('S2', 2024, 'THÀNH ĐẠT', 1250, 17),
('S2', 2024, 'BẢO AVALER', 1200, 18),
('S2', 2024, 'BẢO HUỲNH', 1200, 19),
('S2', 2024, 'BẢO NHỎ', 1150, 20),
('S2', 2024, 'VIỆT ANH', 1100, 21),
('S2', 2024, 'NGUYỄN TUẤN', 1050, 22),
('S2', 2024, 'CƯỜNG FISH', 1025, 23),
('S2', 2024, 'KIWI', 950, 24),
('S2', 2024, 'TỬ ALI', 900, 25),
('S2', 2024, 'TUẤN DŨNG', 900, 26),
('S2', 2024, 'TIẾN BLACK', 900, 27),
('S2', 2024, 'TRƯỜNG PHÚC', 850, 28),
('S2', 2024, 'NGỌC QUÝ', 850, 29),
('S2', 2024, 'MAI MÈO', 850, 30),
('S2', 2024, 'KHÔI LỤC', 800, 31),
('S2', 2024, 'MINH BLACK', 750, 32),
('S2', 2024, 'XUÂN HẠ', 750, 33),
('S2', 2024, 'PHẠM QUANG', 700, 34),
('S2', 2024, 'HUỲNH THÔNG', 700, 35),
('S2', 2024, 'HIỂN MẬP', 700, 36),
('S2', 2024, 'HUY S450', 700, 37),
('S2', 2024, 'TIẾN BỊP 36', 650, 38),
('S2', 2024, 'HÙNG PHI', 600, 39),
('S2', 2024, 'BI SỨA', 600, 40),
('S2', 2024, 'QUỐC VIỆT', 600, 41),
('S2', 2024, 'PHÁT VŨ', 425, 42),
('S2', 2024, 'QUANG ANH', 400, 43),
('S2', 2024, 'HIẾU TRẦN', 400, 44),
('S2', 2024, 'KHOA PHẠM', 400, 45),
('S2', 2024, 'TÙNG', 400, 46),
('S2', 2024, 'QUỐC NGUYỄN', 400, 47),
('S2', 2024, 'BUSTAMANTE', 400, 48),
('S2', 2024, 'THẾ NÁT', 375, 49),
('S2', 2024, 'TRƯƠNG THÔNG', 350, 50),
('S2', 2024, 'NGỌC THÔNG', 350, 51),
('S2', 2024, 'KHẮC VƯƠNG', 325, 52),
('S2', 2024, 'TRƯỜNG TRẦN', 325, 53),
('S2', 2024, 'TÂM EM', 300, 54),
('S2', 2024, 'KHOA PUB', 300, 55),
('S2', 2024, 'BẢO LONG', 250, 56),
('S2', 2024, 'BEN 04', 250, 57),
('S2', 2024, 'MẠNH CƯỜNG', 250, 58),
('S2', 2024, 'BẢO', 250, 59),
('S2', 2024, 'ĐỨC DƯƠNG', 250, 60),
('S2', 2024, 'DŨNG SẢY', 250, 61),
('S2', 2024, 'TRƯỜNG HUY', 250, 62),
('S2', 2024, 'HOÀNG ANH', 200, 63),
('S2', 2024, 'THIỆU KIKI', 200, 64),
('S2', 2024, 'CÔNG', 200, 65),
('S2', 2024, 'HƯNG SABO', 200, 66),
('S2', 2024, 'CHẤN HUY', 200, 67),
('S2', 2024, 'ANH DŨNG', 200, 68),
('S2', 2024, 'PNH', 200, 69),
('S2', 2024, 'CHIP XUF', 200, 70),
('S2', 2024, 'CÔNG DANH', 200, 71),
('S2', 2024, 'GIA BẢO', 200, 72),
('S2', 2024, 'TUẤN ANH', 200, 73),
('S2', 2024, 'HUY HOÀNG', 200, 74),
('S2', 2024, 'TRỌNG KHÁNH', 150, 75),
('S2', 2024, 'CHUNG BŨN', 150, 76),
('S2', 2024, 'BI', 150, 77),
('S2', 2024, 'TRẦN ANH DANH', 150, 78),
('S2', 2024, 'NGUYÊN BÌNH', 150, 79),
('S2', 2024, 'MINH QUÂN', 150, 80),
('S2', 2024, 'TÀI NGUYỄN', 150, 81),
('S2', 2024, 'VIỆT', 150, 82),
('S2', 2024, 'HIẾU', 150, 83),
('S2', 2024, 'THU ĐÔNG', 150, 84),
('S2', 2024, 'TKN', 150, 85),
('S2', 2024, 'BỐP', 150, 86),
('S2', 2024, 'ĐĂNG RĂNG TO', 150, 87),
('S2', 2024, 'TÙNG LÂM', 150, 88),
('S2', 2024, 'DUY HVT', 150, 89),
('S2', 2024, 'CƯỜNG LÂM', 150, 90),
('S2', 2024, 'PHƯỚC VĂN', 150, 91),
('S2', 2024, 'THÀNH VT', 100, 92),
('S2', 2024, 'MẠNH TƯỞNG', 100, 93),
('S2', 2024, 'TUẤN PTDT', 100, 94),
('S2', 2024, 'TÙNG NGÔ', 100, 95),
('S2', 2024, 'NGUYỄN THÀNH', 100, 96),
('S2', 2024, 'HIEUTHUNHAT', 100, 97),
('S2', 2024, 'ĐÌNH VĂN', 100, 98),
('S2', 2024, 'LỤC KHANG', 100, 99),
('S2', 2024, 'NGUYỄN BẢO', 100, 100),
('S2', 2024, 'ĐỨC BỊP', 100, 101),
('S2', 2024, 'VŨ CÒI', 100, 102),
('S2', 2024, 'M.TIẾN', 100, 103),
('S2', 2024, 'NHÂN LÊ', 100, 104),
('S2', 2024, 'HẢI ĐĂNG', 100, 105),
('S2', 2024, 'TÀI TÊ', 100, 106),
('S2', 2024, 'THÀNH LONG', 100, 107),
('S2', 2024, 'GIANG ĐINH', 100, 108),
('S2', 2024, 'CÔNG KHU', 100, 109),
('S2', 2024, 'ĐẠT B', 100, 110),
('S2', 2024, 'TRUNG HIẾU', 100, 111),
('S2', 2024, 'QUANG VINH', 100, 112),
('S2', 2024, 'QUỐC ANH', 100, 113),
('S2', 2024, 'TOÀN CC', 100, 114),
('S2', 2024, 'QUÝ BÉO', 100, 115),
('S2', 2024, 'TÀI NGUYỄN', 100, 116),
('S2', 2024, 'XUÂN KHẢI', 100, 117),
('S2', 2024, 'GIANG DINH', 100, 118),
('S2', 2024, 'NGỌC THÔNG', 100, 119),
('S2', 2024, 'TUẤN MINH', 100, 120),
('S2', 2024, 'BIN BÁNH BÒ', 100, 121),
('S2', 2024, 'CÒ', 100, 122),
('S2', 2024, 'CUA', 100, 123),
('S2', 2024, 'CÔNG DANH', 100, 124),
('S2', 2024, 'TUẤN TÀI', 100, 125),
('S2', 2024, 'VŨ', 100, 126),
('S2', 2024, 'QUANG MINH', 100, 127),
('S2', 2024, 'ANH TUẤN', 100, 128),
('S2', 2024, 'ĐỨC ANH', 100, 129),
('S2', 2024, 'KIỆT', 100, 130),
('S2', 2024, 'TIẾN ĐẠT', 100, 131),
('S2', 2024, 'HUY TRẦN', 100, 132),
('S2', 2024, 'THÁI PHONG', 100, 133),
('S2', 2024, 'THÔNG NGUYỄN', 100, 134),
('S2', 2024, 'CÔNG TIẾN', 100, 135),
('S2', 2024, 'HOÀNG NGUYỄN', 100, 136),
('S2', 2024, 'THỊNH PHÁT', 100, 137),
('S2', 2024, 'VINH TIẾN', 100, 138),
('S2', 2024, 'VĂN SANG', 100, 139),
('S2', 2024, 'LÊ VƯƠNG', 100, 140),
('S2', 2024, 'QUÝ TÔM', 100, 141),
('S2', 2024, 'SỸ TRỌNG', 100, 142),
('S2', 2024, 'QUANG TÈO', 100, 143),
('S2', 2024, 'BOPEL', 100, 144),
('S2', 2024, 'THÀNH LONG', 100, 145),
('S2', 2024, 'HIỄN DẦN', 100, 146),
('S2', 2024, 'HUY BLACK', 100, 147),
('S2', 2024, 'TUẤN PHONG', 100, 148),
('S2', 2024, 'TRÍ TUẤN', 100, 149),
('S2', 2024, 'ĐỨC CHIẾN', 100, 150),
('S2', 2024, 'A.LONG', 100, 151),
('S2', 2024, 'MR.TÌNH', 100, 152),
('S2', 2024, 'TRÍ MINHON', 0, 153);

-- Create a view for easy access to season statistics
CREATE OR REPLACE VIEW season_stats AS
SELECT 
  season_name,
  season_year,
  COUNT(*) as total_players,
  MAX(ranking_points) as highest_points,
  MIN(ranking_points) as lowest_points,
  AVG(ranking_points) as average_points,
  MAX(final_rank) as total_ranks
FROM season_history
GROUP BY season_name, season_year
ORDER BY season_year DESC, season_name DESC;

-- Create a function to get user's best season performance
CREATE OR REPLACE FUNCTION get_user_best_season(user_nickname TEXT)
RETURNS TABLE (
  season_name TEXT,
  season_year INTEGER,
  ranking_points INTEGER,
  final_rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.season_name,
    sh.season_year,
    sh.ranking_points,
    sh.final_rank
  FROM season_history sh
  WHERE sh.nickname ILIKE '%' || user_nickname || '%'
  ORDER BY sh.ranking_points DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql; 