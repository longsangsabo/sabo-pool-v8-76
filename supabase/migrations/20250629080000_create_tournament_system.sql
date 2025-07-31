-- Create tournament tiers table
CREATE TABLE IF NOT EXISTS tournament_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    elo_points JSONB NOT NULL,
    min_rank_requirement VARCHAR(50),
    max_rank_requirement VARCHAR(50),
    entry_fee_range JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
    description TEXT,
    total_prize_pool DECIMAL(15,2) DEFAULT 0,
    total_tournaments INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    tournament_type VARCHAR(50) NOT NULL CHECK (tournament_type IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')),
    game_format VARCHAR(50) NOT NULL CHECK (game_format IN ('8_ball', '9_ball', '10_ball', 'straight_pool')),
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    registration_start TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_end TIMESTAMP WITH TIME ZONE NOT NULL,
    tournament_start TIMESTAMP WITH TIME ZONE NOT NULL,
    tournament_end TIMESTAMP WITH TIME ZONE NOT NULL,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    venue_address TEXT,
    entry_fee DECIMAL(10,2) NOT NULL,
    prize_pool DECIMAL(15,2) NOT NULL,
    first_prize DECIMAL(15,2) NOT NULL,
    second_prize DECIMAL(15,2) NOT NULL,
    third_prize DECIMAL(15,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled')),
    rules TEXT,
    contact_info JSONB,
    banner_image TEXT,
    tier_code VARCHAR(10) REFERENCES tournament_tiers(code),
    season_id UUID REFERENCES seasons(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament registrations table
CREATE TABLE IF NOT EXISTS tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled', 'withdrawn')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- Create tournament matches table
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    player1_id UUID REFERENCES auth.users(id),
    player2_id UUID REFERENCES auth.users(id),
    score_player1 INTEGER,
    score_player2 INTEGER,
    winner_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament results table
CREATE TABLE IF NOT EXISTS tournament_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    final_position INTEGER NOT NULL,
    elo_points_earned INTEGER NOT NULL DEFAULT 0,
    prize_money DECIMAL(15,2),
    performance_rating DECIMAL(5,2),
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- Create season standings table
CREATE TABLE IF NOT EXISTS season_standings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_elo_points INTEGER DEFAULT 0,
    tournaments_played INTEGER DEFAULT 0,
    best_finish INTEGER,
    total_prize_money DECIMAL(15,2) DEFAULT 0,
    current_rank INTEGER,
    previous_rank INTEGER,
    rank_change INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(season_id, user_id)
);

-- Create club standings table
CREATE TABLE IF NOT EXISTS club_standings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_elo_points INTEGER DEFAULT 0,
    tournaments_played INTEGER DEFAULT 0,
    best_finish INTEGER,
    current_rank INTEGER,
    previous_rank INTEGER,
    rank_change INTEGER DEFAULT 0,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);

-- Insert default tournament tiers
INSERT INTO tournament_tiers (name, code, description, elo_points, entry_fee_range) VALUES
('Giải Hạng G', 'G', 'Giải đấu cao cấp nhất', 
 '{"first": 1200, "second": 900, "third": 700, "fourth": 500, "top8": 250, "participation": 100}',
 '{"min": 500000, "max": 2000000}'),
('Giải Hạng H', 'H', 'Giải đấu trung cấp', 
 '{"first": 1100, "second": 850, "third": 650, "fourth": 450, "top8": 200, "participation": 100}',
 '{"min": 200000, "max": 800000}'),
('Giải Hạng I', 'I', 'Giải đấu cơ bản', 
 '{"first": 1000, "second": 800, "third": 600, "fourth": 400, "top8": 150, "participation": 100}',
 '{"min": 100000, "max": 500000}'),
('Giải Hạng K', 'K', 'Giải đấu cho người mới', 
 '{"first": 1000, "second": 800, "third": 600, "fourth": 400, "top8": 150, "participation": 100}',
 '{"min": 50000, "max": 200000}');

-- Insert current season (Season 2 - 2025)
INSERT INTO seasons (name, year, start_date, end_date, status, description) VALUES
('Mùa 2 - 2025', 2025, '2025-01-01', '2025-09-30', 'ongoing', 'Mùa giải thứ 2 của SABO POOL ARENA');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournaments_club_id ON tournaments(club_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_season_id ON tournaments(season_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_tier_code ON tournaments(tier_code);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user_id ON tournament_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id ON tournament_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_user_id ON tournament_results(user_id);
CREATE INDEX IF NOT EXISTS idx_season_standings_season_id ON season_standings(season_id);
CREATE INDEX IF NOT EXISTS idx_season_standings_user_id ON season_standings(user_id);
CREATE INDEX IF NOT EXISTS idx_club_standings_club_id ON club_standings(club_id);
CREATE INDEX IF NOT EXISTS idx_club_standings_user_id ON club_standings(user_id);

-- Create function to calculate ELO points based on tournament tier and position
CREATE OR REPLACE FUNCTION calculate_tournament_elo_points(
    tier_code VARCHAR(10),
    final_position INTEGER
) RETURNS INTEGER AS $$
DECLARE
    elo_points INTEGER;
    tier_data JSONB;
BEGIN
    -- Get tier data
    SELECT elo_points INTO tier_data 
    FROM tournament_tiers 
    WHERE code = tier_code;
    
    IF tier_data IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate ELO points based on position
    CASE 
        WHEN final_position = 1 THEN
            elo_points := (tier_data->>'first')::INTEGER;
        WHEN final_position = 2 THEN
            elo_points := (tier_data->>'second')::INTEGER;
        WHEN final_position = 3 THEN
            elo_points := (tier_data->>'third')::INTEGER;
        WHEN final_position = 4 THEN
            elo_points := (tier_data->>'fourth')::INTEGER;
        WHEN final_position <= 8 THEN
            elo_points := (tier_data->>'top8')::INTEGER;
        ELSE
            elo_points := (tier_data->>'participation')::INTEGER;
    END CASE;
    
    RETURN elo_points;
END;
$$ LANGUAGE plpgsql;

-- Create function to update season standings after tournament completion
CREATE OR REPLACE FUNCTION update_season_standings_after_tournament()
RETURNS TRIGGER AS $$
BEGIN
    -- Update season standings when tournament result is inserted/updated
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO season_standings (season_id, user_id, total_elo_points, tournaments_played, best_finish, total_prize_money)
        SELECT 
            t.season_id,
            NEW.user_id,
            NEW.elo_points_earned,
            1,
            NEW.final_position,
            COALESCE(NEW.prize_money, 0)
        FROM tournaments t
        WHERE t.id = NEW.tournament_id
        ON CONFLICT (season_id, user_id) DO UPDATE SET
            total_elo_points = season_standings.total_elo_points + NEW.elo_points_earned,
            tournaments_played = season_standings.tournaments_played + 1,
            best_finish = LEAST(season_standings.best_finish, NEW.final_position),
            total_prize_money = season_standings.total_prize_money + COALESCE(NEW.prize_money, 0),
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update club standings after tournament completion
CREATE OR REPLACE FUNCTION update_club_standings_after_tournament()
RETURNS TRIGGER AS $$
BEGIN
    -- Update club standings when tournament result is inserted/updated
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO club_standings (club_id, user_id, total_elo_points, tournaments_played, best_finish)
        SELECT 
            t.club_id,
            NEW.user_id,
            NEW.elo_points_earned,
            1,
            NEW.final_position
        FROM tournaments t
        WHERE t.id = NEW.tournament_id
        ON CONFLICT (club_id, user_id) DO UPDATE SET
            total_elo_points = club_standings.total_elo_points + NEW.elo_points_earned,
            tournaments_played = club_standings.tournaments_played + 1,
            best_finish = LEAST(club_standings.best_finish, NEW.final_position),
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_season_standings
    AFTER INSERT OR UPDATE ON tournament_results
    FOR EACH ROW
    EXECUTE FUNCTION update_season_standings_after_tournament();

CREATE TRIGGER trigger_update_club_standings
    AFTER INSERT OR UPDATE ON tournament_results
    FOR EACH ROW
    EXECUTE FUNCTION update_club_standings_after_tournament();

-- Create function to recalculate rankings
CREATE OR REPLACE FUNCTION recalculate_rankings()
RETURNS VOID AS $$
BEGIN
    -- Recalculate season rankings
    WITH ranked_season AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY season_id ORDER BY total_elo_points DESC, tournaments_played DESC) as new_rank
        FROM season_standings
    )
    UPDATE season_standings ss
    SET 
        previous_rank = current_rank,
        current_rank = rs.new_rank,
        rank_change = COALESCE(current_rank, 0) - rs.new_rank,
        updated_at = NOW()
    FROM ranked_season rs
    WHERE ss.id = rs.id;
    
    -- Recalculate club rankings
    WITH ranked_club AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY club_id ORDER BY total_elo_points DESC, tournaments_played DESC) as new_rank
        FROM club_standings
    )
    UPDATE club_standings cs
    SET 
        previous_rank = current_rank,
        current_rank = rc.new_rank,
        rank_change = COALESCE(current_rank, 0) - rc.new_rank,
        updated_at = NOW()
    FROM ranked_club rc
    WHERE cs.id = rc.id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE tournament_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_standings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournament_tiers (read-only for all authenticated users)
CREATE POLICY "Allow read access to tournament tiers" ON tournament_tiers
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for seasons (read-only for all authenticated users)
CREATE POLICY "Allow read access to seasons" ON seasons
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for tournaments
CREATE POLICY "Allow read access to tournaments" ON tournaments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow club owners to create tournaments" ON tournaments
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND 
        EXISTS (
            SELECT 1 FROM clubs 
            WHERE id = club_id AND 
            (created_by = auth.uid() OR is_sabo_owned = true)
        )
    );

CREATE POLICY "Allow club owners to update tournaments" ON tournaments
    FOR UPDATE USING (
        auth.uid() = created_by AND 
        EXISTS (
            SELECT 1 FROM clubs 
            WHERE id = club_id AND 
            (created_by = auth.uid() OR is_sabo_owned = true)
        )
    );

-- RLS Policies for tournament_registrations
CREATE POLICY "Allow users to view their own registrations" ON tournament_registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to register for tournaments" ON tournament_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own registrations" ON tournament_registrations
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for tournament_matches
CREATE POLICY "Allow read access to tournament matches" ON tournament_matches
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow tournament organizers to manage matches" ON tournament_matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_id AND t.created_by = auth.uid()
        )
    );

-- RLS Policies for tournament_results
CREATE POLICY "Allow read access to tournament results" ON tournament_results
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow tournament organizers to manage results" ON tournament_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_id AND t.created_by = auth.uid()
        )
    );

-- RLS Policies for season_standings
CREATE POLICY "Allow read access to season standings" ON season_standings
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for club_standings
CREATE POLICY "Allow read access to club standings" ON club_standings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow club owners to manage club standings" ON club_standings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clubs c
            WHERE c.id = club_id AND 
            (c.created_by = auth.uid() OR c.is_sabo_owned = true)
        )
    ); 