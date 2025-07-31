-- Create player_rankings table
CREATE TABLE IF NOT EXISTS player_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname TEXT NOT NULL,
    rank_code TEXT NOT NULL CHECK (rank_code IN ('G', 'H+', 'H', 'I+', 'I', 'K+', 'K')),
    balls_consistent INTEGER NOT NULL CHECK (balls_consistent >= 1 AND balls_consistent <= 10),
    can_do_cham_don BOOLEAN DEFAULT false,
    can_do_cham_pha BOOLEAN DEFAULT false,
    is_stable BOOLEAN DEFAULT false,
    tournament_achievement TEXT,
    promotion_ready BOOLEAN DEFAULT false,
    club_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create qr_codes table for player identification
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    qr_code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table_qr_codes table for pool tables
CREATE TABLE IF NOT EXISTS table_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    qr_code TEXT UNIQUE NOT NULL,
    table_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(club_id, table_number)
);

-- Create quick_matches table for QR-based matches
CREATE TABLE IF NOT EXISTS quick_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID REFERENCES table_qr_codes(id) ON DELETE CASCADE,
    player1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_type VARCHAR(20) NOT NULL CHECK (game_type IN ('8_ball', '9_ball', 'song_to')),
    bet_points INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ongoing', 'completed', 'cancelled')),
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES auth.users(id),
    player1_confirmed BOOLEAN DEFAULT false,
    player2_confirmed BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT different_players CHECK (player1_id != player2_id)
);

-- Create match_results table for detailed results
CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES quick_matches(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    loser_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    winner_score INTEGER NOT NULL,
    loser_score INTEGER NOT NULL,
    elo_points_exchanged INTEGER DEFAULT 0,
    winner_elo_change INTEGER DEFAULT 0,
    loser_elo_change INTEGER DEFAULT 0,
    match_duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT different_winner_loser CHECK (winner_id != loser_id)
);

-- Create season_2_2025 table for season information
CREATE TABLE IF NOT EXISTS season_2_2025 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_name TEXT NOT NULL DEFAULT 'Season 2 - 2025',
    start_date DATE NOT NULL DEFAULT '2025-06-01',
    end_date DATE NOT NULL DEFAULT '2025-09-30',
    registration_fee INTEGER NOT NULL DEFAULT 99000,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    total_participants INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create season_2_prizes table for prize structure
CREATE TABLE IF NOT EXISTS season_2_prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rank_min INTEGER NOT NULL,
    rank_max INTEGER NOT NULL,
    prize_description TEXT NOT NULL,
    prize_value INTEGER NOT NULL,
    voucher_amount INTEGER DEFAULT 0,
    member_months INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert season 2 data
INSERT INTO season_2_2025 (season_name, start_date, end_date, registration_fee, status) VALUES
('Season 2 - 2025', '2025-06-01', '2025-09-30', 99000, 'active');

-- Insert prize structure for season 2
INSERT INTO season_2_prizes (rank_min, rank_max, prize_description, prize_value, voucher_amount, member_months) VALUES
(1, 1, 'Gậy cá nhân CUSTOM SBO-2304S + ÁO ĐẤU SABO + 1 Tháng thẻ Member', 4000000, 0, 1),
(2, 2, 'BAO ĐỰNG CƠ CAO CẤP + ÁO ĐẤU SABO + 1 Tháng thẻ Member', 1500000, 0, 1),
(3, 3, 'LƠ TP + ÁO ĐẤU SABO + 1 Tháng thẻ Member', 800000, 0, 1),
(4, 4, 'GĂNG TAY CÁ NHÂN + ÁO ĐẤU SABO + 1 Tháng thẻ Member', 600000, 0, 1),
(5, 5, 'ÁO ĐẤU SABO + 100K VOUCHER + 1 Tháng thẻ Member', 500000, 100000, 1),
(6, 10, '300K VOUCHER + 1 Tháng thẻ Member', 400000, 300000, 1),
(11, 20, '200K VOUCHER + 1 Tháng thẻ Member', 300000, 200000, 1),
(21, 40, '100K VOUCHER + 1 Tháng thẻ Member', 200000, 100000, 1);

-- Insert sample player rankings based on the provided classification
INSERT INTO player_rankings (nickname, rank_code, balls_consistent, can_do_cham_don, can_do_cham_pha, is_stable, tournament_achievement, promotion_ready, club_notes) VALUES
-- Hạng G - Đi được 7-8 bi ổn định, có thể đi 1 chấm phá + 1 chấm đơn
('Đăng RT', 'G', 8, true, true, true, 'Vô địch CLB Sabo 2024', true, 'Top player của CLB'),
('Minh Pro', 'G', 7, true, true, true, 'Top 4 tỉnh 2024', true, 'Kỹ thuật xuất sắc'),
('Hùng Master', 'G', 8, true, true, true, 'Champion giải mở rộng', true, 'Đã sẵn sàng lên chuyên nghiệp'),

-- Hạng H+ - Đi được 5-7 bi ổn định, có thể đi 1 chấm đơn
('Thùy Linh', 'H+', 6, true, false, true, 'Top 4 nữ miền Bắc', true, 'Tiềm năng lên G'),
('Tuấn Anh', 'H+', 7, true, false, true, 'Top 8 giải tỉnh', true, 'Sắp đạt tiêu chuẩn lên G'),
('Hương Nữ', 'H+', 5, true, false, true, 'Vô địch nữ CLB', true, 'Thường xuyên giao lưu CLB khác'),

-- Hạng H - Đi được 4-6 bi không đều, có thể dọn bi với hỗ trợ
('Lê Vương', 'H', 5, false, false, false, 'Top 4 nội bộ CLB', false, 'Mới đạt thành tích ở nội bộ'),
('Mai Hoa', 'H', 4, false, false, false, 'Top 8 nội bộ', false, 'Được CLB đánh giá cao'),
('Đức Anh', 'H', 6, false, false, false, 'Tham gia hệ thống phân hạng', false, 'Cần thêm va chạm thực tế'),

-- Hạng I+ - Đi được 4-5 bi, ổn định, không thể đi chấm
('Nguyễn Tùng', 'I+', 4, false, false, true, 'Luyện tập lên H', false, 'Có biểu hiện tiến bộ rõ'),
('Hà My', 'I+', 5, false, false, true, 'Có hướng dẫn từ người chơi cao cấp', false, 'Đang luyện tập lên H'),
('Văn Đức', 'I+', 4, false, false, true, 'Tham gia giải giao lưu', false, 'Có tiềm năng phát triển'),

-- Hạng I - Đi được 3-4 bi, chưa ổn định, thiếu chiến thuật
('Minh Tuấn', 'I', 3, false, false, false, 'Mới gia nhập CLB', false, 'Đã thi đấu ít trận chính thức'),
('Thu Hà', 'I', 4, false, false, false, 'Cần thêm va chạm thực tế', false, 'Mới gia nhập CLB'),
('Hoàng Nam', 'I', 3, false, false, false, 'Chơi giải giao lưu nhỏ', false, 'Cần học lối chơi và luật'),

-- Hạng K+ - Đi được 3-5 bi, không ổn định, chưa đủ khả năng dọn hình
('Tuân Xí Lụm', 'K+', 3, false, false, false, 'Có tiềm năng nhưng chưa luyện tập đều', false, 'Chơi giải giao lưu nhỏ'),
('Minh Đức', 'K+', 4, false, false, false, 'Mới bắt đầu học kỹ năng cơ bản', false, 'Cần thêm thời gian luyện tập'),
('Hương Giang', 'K+', 5, false, false, false, 'Chưa thi đấu lần nào', false, 'Có tiềm năng phát triển'),

-- Hạng K - Đi được 2-3 bi, mới bắt đầu học kỹ năng cơ bản
('Anh Tuấn', 'K', 2, false, false, false, 'Người chơi mới', false, 'Cần học lối chơi và luật'),
('Minh Hoa', 'K', 3, false, false, false, 'Chưa thi đấu lần nào', false, 'Mới bắt đầu học kỹ năng cơ bản'),
('Văn Thành', 'K', 2, false, false, false, 'Cần học lối chơi và luật', false, 'Người chơi mới');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_player_rankings_rank_code ON player_rankings(rank_code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_qr_code ON qr_codes(qr_code);
CREATE INDEX IF NOT EXISTS idx_table_qr_codes_club_id ON table_qr_codes(club_id);
CREATE INDEX IF NOT EXISTS idx_table_qr_codes_qr_code ON table_qr_codes(qr_code);
CREATE INDEX IF NOT EXISTS idx_quick_matches_table_id ON quick_matches(table_id);
CREATE INDEX IF NOT EXISTS idx_quick_matches_status ON quick_matches(status);
CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON match_results(match_id);

-- Function to generate QR code
CREATE OR REPLACE FUNCTION generate_qr_code(prefix TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN prefix || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8);
END;
$$ LANGUAGE plpgsql;

-- Function to create player QR code
CREATE OR REPLACE FUNCTION create_player_qr_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    qr_code TEXT;
BEGIN
    qr_code := generate_qr_code('PLAYER');
    
    INSERT INTO qr_codes (user_id, qr_code)
    VALUES (p_user_id, qr_code)
    ON CONFLICT (user_id) DO UPDATE SET
        qr_code = EXCLUDED.qr_code,
        updated_at = NOW();
    
    RETURN qr_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create table QR code
CREATE OR REPLACE FUNCTION create_table_qr_code(p_club_id UUID, p_table_number INTEGER, p_table_name TEXT)
RETURNS TEXT AS $$
DECLARE
    qr_code TEXT;
BEGIN
    qr_code := generate_qr_code('TABLE');
    
    INSERT INTO table_qr_codes (club_id, table_number, qr_code, table_name)
    VALUES (p_club_id, p_table_number, qr_code, p_table_name)
    ON CONFLICT (club_id, table_number) DO UPDATE SET
        qr_code = EXCLUDED.qr_code,
        table_name = EXCLUDED.table_name,
        updated_at = NOW();
    
    RETURN qr_code;
END;
$$ LANGUAGE plpgsql;

-- Function to process quick match result
CREATE OR REPLACE FUNCTION process_quick_match_result(
    p_match_id UUID,
    p_winner_id UUID,
    p_loser_id UUID,
    p_winner_score INTEGER,
    p_loser_score INTEGER
) RETURNS VOID AS $$
DECLARE
    v_winner_rating INTEGER;
    v_loser_rating INTEGER;
    v_winner_elo_change INTEGER;
    v_loser_elo_change INTEGER;
    v_elo_points_exchanged INTEGER;
BEGIN
    -- Get current ratings
    SELECT ranking_points INTO v_winner_rating FROM user_profiles WHERE user_id = p_winner_id;
    SELECT ranking_points INTO v_loser_rating FROM user_profiles WHERE user_id = p_loser_id;
    
    -- Calculate ELO changes (simplified for quick matches)
    v_elo_points_exchanged := 50; -- Fixed points for quick matches
    v_winner_elo_change := 25;
    v_loser_elo_change := -25;
    
    -- Insert match result
    INSERT INTO match_results (
        match_id, winner_id, loser_id, winner_score, loser_score,
        elo_points_exchanged, winner_elo_change, loser_elo_change
    ) VALUES (
        p_match_id, p_winner_id, p_loser_id, p_winner_score, p_loser_score,
        v_elo_points_exchanged, v_winner_elo_change, v_loser_elo_change
    );
    
    -- Update quick match status
    UPDATE quick_matches 
    SET 
        status = 'completed',
        winner_id = p_winner_id,
        player1_score = CASE WHEN p_winner_id = player1_id THEN p_winner_score ELSE p_loser_score END,
        player2_score = CASE WHEN p_winner_id = player2_id THEN p_winner_score ELSE p_loser_score END,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_match_id;
    
    -- Update user ratings
    UPDATE user_profiles 
    SET ranking_points = ranking_points + v_winner_elo_change,
        wins = wins + 1,
        matches_played = matches_played + 1,
        updated_at = NOW()
    WHERE user_id = p_winner_id;
    
    UPDATE user_profiles 
    SET ranking_points = ranking_points + v_loser_elo_change,
        losses = losses + 1,
        matches_played = matches_played + 1,
        updated_at = NOW()
    WHERE user_id = p_loser_id;
    
    -- Update season standings
    INSERT INTO season_standings (season_id, user_id, total_elo_points, tournaments_played)
    SELECT 
        s.id,
        p_winner_id,
        v_winner_elo_change,
        0
    FROM seasons s
    WHERE s.status = 'ongoing'
    ON CONFLICT (season_id, user_id) DO UPDATE SET
        total_elo_points = season_standings.total_elo_points + v_winner_elo_change,
        updated_at = NOW();
    
    INSERT INTO season_standings (season_id, user_id, total_elo_points, tournaments_played)
    SELECT 
        s.id,
        p_loser_id,
        v_loser_elo_change,
        0
    FROM seasons s
    WHERE s.status = 'ongoing'
    ON CONFLICT (season_id, user_id) DO UPDATE SET
        total_elo_points = season_standings.total_elo_points + v_loser_elo_change,
        updated_at = NOW();
    
    -- Recalculate rankings
    PERFORM recalculate_rankings();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE player_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_2_2025 ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_2_prizes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to player rankings" ON player_rankings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access to qr codes" ON qr_codes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to manage their own qr codes" ON qr_codes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow read access to table qr codes" ON table_qr_codes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow club owners to manage table qr codes" ON table_qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clubs c
            WHERE c.id = club_id AND 
            (c.created_by = auth.uid() OR c.is_sabo_owned = true)
        )
    );

CREATE POLICY "Allow read access to quick matches" ON quick_matches
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow players to manage their matches" ON quick_matches
    FOR ALL USING (
        auth.uid() IN (player1_id, player2_id) OR
        EXISTS (
            SELECT 1 FROM table_qr_codes tqc
            JOIN clubs c ON tqc.club_id = c.id
            WHERE tqc.id = table_id AND 
            (c.created_by = auth.uid() OR c.is_sabo_owned = true)
        )
    );

CREATE POLICY "Allow read access to match results" ON match_results
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow system to insert match results" ON match_results
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read access to season 2" ON season_2_2025
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access to season 2 prizes" ON season_2_prizes
    FOR SELECT USING (auth.role() = 'authenticated'); 