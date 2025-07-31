-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    opponent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    bet_points INTEGER NOT NULL CHECK (bet_points >= 100 AND bet_points <= 650),
    race_to INTEGER NOT NULL,
    handicap_1_rank DECIMAL(3,1) NOT NULL,
    handicap_05_rank DECIMAL(3,1) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'ongoing', 'completed', 'cancelled')),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    challenger_score INTEGER,
    opponent_score INTEGER,
    winner_id UUID REFERENCES auth.users(id),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_notes TEXT,
    verification_images TEXT[],
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT different_players CHECK (challenger_id != opponent_id)
);

-- Create challenge_results table
CREATE TABLE IF NOT EXISTS challenge_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    loser_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    winner_score INTEGER NOT NULL,
    loser_score INTEGER NOT NULL,
    elo_points_exchanged INTEGER NOT NULL,
    winner_elo_change INTEGER NOT NULL,
    loser_elo_change INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT different_winner_loser CHECK (winner_id != loser_id)
);

-- Create challenge_verifications table
CREATE TABLE IF NOT EXISTS challenge_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    verifier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('image', 'receipt', 'other')),
    verification_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_id ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_opponent_id ON challenges(opponent_id);
CREATE INDEX IF NOT EXISTS idx_challenges_club_id ON challenges(club_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_verification_status ON challenges(verification_status);
CREATE INDEX IF NOT EXISTS idx_challenge_results_challenge_id ON challenge_results(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_results_winner_id ON challenge_results(winner_id);
CREATE INDEX IF NOT EXISTS idx_challenge_results_loser_id ON challenge_results(loser_id);
CREATE INDEX IF NOT EXISTS idx_challenge_verifications_challenge_id ON challenge_verifications(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_verifications_verifier_id ON challenge_verifications(verifier_id);

-- Function to get challenge configuration based on bet points
CREATE OR REPLACE FUNCTION get_challenge_config(bet_points INTEGER)
RETURNS TABLE (
    race_to INTEGER,
    handicap_1_rank DECIMAL(3,1),
    handicap_05_rank DECIMAL(3,1),
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN bet_points BETWEEN 600 AND 650 THEN 22
            WHEN bet_points BETWEEN 500 AND 550 THEN 18
            WHEN bet_points BETWEEN 400 AND 450 THEN 16
            WHEN bet_points BETWEEN 300 AND 350 THEN 14
            WHEN bet_points BETWEEN 200 AND 250 THEN 12
            WHEN bet_points BETWEEN 100 AND 150 THEN 8
            ELSE 8
        END as race_to,
        CASE 
            WHEN bet_points BETWEEN 600 AND 650 THEN 3.5
            WHEN bet_points BETWEEN 500 AND 550 THEN 3.0
            WHEN bet_points BETWEEN 400 AND 450 THEN 2.5
            WHEN bet_points BETWEEN 300 AND 350 THEN 2.0
            WHEN bet_points BETWEEN 200 AND 250 THEN 1.5
            WHEN bet_points BETWEEN 100 AND 150 THEN 1.0
            ELSE 1.0
        END as handicap_1_rank,
        CASE 
            WHEN bet_points BETWEEN 600 AND 650 THEN 2.5
            WHEN bet_points BETWEEN 500 AND 550 THEN 2.0
            WHEN bet_points BETWEEN 400 AND 450 THEN 1.5
            WHEN bet_points BETWEEN 300 AND 350 THEN 1.5
            WHEN bet_points BETWEEN 200 AND 250 THEN 1.0
            WHEN bet_points BETWEEN 100 AND 150 THEN 0.5
            ELSE 0.5
        END as handicap_05_rank,
        CASE 
            WHEN bet_points BETWEEN 600 AND 650 THEN 'Thách đấu cao cấp - Race to 22'
            WHEN bet_points BETWEEN 500 AND 550 THEN 'Thách đấu trung cao - Race to 18'
            WHEN bet_points BETWEEN 400 AND 450 THEN 'Thách đấu trung cấp - Race to 16'
            WHEN bet_points BETWEEN 300 AND 350 THEN 'Thách đấu trung bình - Race to 14'
            WHEN bet_points BETWEEN 200 AND 250 THEN 'Thách đấu cơ bản - Race to 12'
            WHEN bet_points BETWEEN 100 AND 150 THEN 'Thách đấu sơ cấp - Race to 8'
            ELSE 'Thách đấu sơ cấp - Race to 8'
        END as description;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate ELO for challenge
CREATE OR REPLACE FUNCTION calculate_challenge_elo(
    winner_rating INTEGER,
    loser_rating INTEGER,
    bet_points INTEGER
) RETURNS TABLE (
    winner_elo_change INTEGER,
    loser_elo_change INTEGER,
    elo_points_exchanged INTEGER
) AS $$
DECLARE
    k_factor INTEGER;
    expected_winner_win DECIMAL(10,8);
    expected_loser_win DECIMAL(10,8);
    actual_winner_win INTEGER := 1;
    actual_loser_win INTEGER := 0;
BEGIN
    -- Calculate K-factor based on bet points
    k_factor := CASE 
        WHEN bet_points >= 600 THEN 32
        WHEN bet_points >= 500 THEN 28
        WHEN bet_points >= 400 THEN 24
        WHEN bet_points >= 300 THEN 20
        WHEN bet_points >= 200 THEN 16
        ELSE 12
    END;
    
    -- Calculate expected win probability
    expected_winner_win := 1.0 / (1.0 + POWER(10.0, (loser_rating - winner_rating) / 400.0));
    expected_loser_win := 1.0 - expected_winner_win;
    
    -- Calculate ELO changes
    RETURN QUERY
    SELECT 
        ROUND((k_factor * (actual_winner_win - expected_winner_win))::INTEGER) as winner_elo_change,
        ROUND((k_factor * (actual_loser_win - expected_loser_win))::INTEGER) as loser_elo_change,
        bet_points as elo_points_exchanged;
END;
$$ LANGUAGE plpgsql;

-- Function to process challenge result
CREATE OR REPLACE FUNCTION process_challenge_result(
    p_challenge_id UUID,
    p_winner_id UUID,
    p_loser_id UUID,
    p_winner_score INTEGER,
    p_loser_score INTEGER
) RETURNS VOID AS $$
DECLARE
    v_challenge challenges%ROWTYPE;
    v_winner_rating INTEGER;
    v_loser_rating INTEGER;
    v_winner_elo_change INTEGER;
    v_loser_elo_change INTEGER;
    v_elo_points_exchanged INTEGER;
BEGIN
    -- Get challenge details
    SELECT * INTO v_challenge FROM challenges WHERE id = p_challenge_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Challenge not found';
    END IF;
    
    -- Get current ratings
    SELECT ranking_points INTO v_winner_rating FROM user_profiles WHERE user_id = p_winner_id;
    SELECT ranking_points INTO v_loser_rating FROM user_profiles WHERE user_id = p_loser_id;
    
    -- Calculate ELO changes
    SELECT winner_elo_change, loser_elo_change, elo_points_exchanged
    INTO v_winner_elo_change, v_loser_elo_change, v_elo_points_exchanged
    FROM calculate_challenge_elo(v_winner_rating, v_loser_rating, v_challenge.bet_points);
    
    -- Insert challenge result
    INSERT INTO challenge_results (
        challenge_id, winner_id, loser_id, winner_score, loser_score,
        elo_points_exchanged, winner_elo_change, loser_elo_change
    ) VALUES (
        p_challenge_id, p_winner_id, p_loser_id, p_winner_score, p_loser_score,
        v_elo_points_exchanged, v_winner_elo_change, v_loser_elo_change
    );
    
    -- Update challenge status
    UPDATE challenges 
    SET 
        status = 'completed',
        winner_id = p_winner_id,
        challenger_score = CASE WHEN p_winner_id = challenger_id THEN p_winner_score ELSE p_loser_score END,
        opponent_score = CASE WHEN p_winner_id = opponent_id THEN p_winner_score ELSE p_loser_score END,
        actual_end_time = NOW(),
        updated_at = NOW()
    WHERE id = p_challenge_id;
    
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
    
    -- Update club standings
    INSERT INTO club_standings (club_id, user_id, total_elo_points, tournaments_played)
    VALUES (v_challenge.club_id, p_winner_id, v_winner_elo_change, 0)
    ON CONFLICT (club_id, user_id) DO UPDATE SET
        total_elo_points = club_standings.total_elo_points + v_winner_elo_change,
        updated_at = NOW();
    
    INSERT INTO club_standings (club_id, user_id, total_elo_points, tournaments_played)
    VALUES (v_challenge.club_id, p_loser_id, v_loser_elo_change, 0)
    ON CONFLICT (club_id, user_id) DO UPDATE SET
        total_elo_points = club_standings.total_elo_points + v_loser_elo_change,
        updated_at = NOW();
    
    -- Recalculate rankings
    PERFORM recalculate_rankings();
END;
$$ LANGUAGE plpgsql;

-- Function to verify challenge
CREATE OR REPLACE FUNCTION verify_challenge(
    p_challenge_id UUID,
    p_verifier_id UUID,
    p_verification_type VARCHAR(20),
    p_verification_data JSONB
) RETURNS VOID AS $$
BEGIN
    -- Insert verification record
    INSERT INTO challenge_verifications (
        challenge_id, verifier_id, verification_type, verification_data
    ) VALUES (
        p_challenge_id, p_verifier_id, p_verification_type, p_verification_data
    );
    
    -- Update challenge verification status
    UPDATE challenges 
    SET 
        verification_status = 'verified',
        verified_by = p_verifier_id,
        verified_at = NOW(),
        updated_at = NOW()
    WHERE id = p_challenge_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Allow users to view challenges" ON challenges
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to create challenges" ON challenges
    FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Allow challenge participants to update challenges" ON challenges
    FOR UPDATE USING (
        auth.uid() IN (challenger_id, opponent_id) OR
        EXISTS (
            SELECT 1 FROM clubs c
            WHERE c.id = club_id AND 
            (c.created_by = auth.uid() OR c.is_sabo_owned = true)
        )
    );

-- RLS Policies for challenge_results
CREATE POLICY "Allow users to view challenge results" ON challenge_results
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow system to insert challenge results" ON challenge_results
    FOR INSERT WITH CHECK (true);

-- RLS Policies for challenge_verifications
CREATE POLICY "Allow users to view challenge verifications" ON challenge_verifications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow club owners and admins to create verifications" ON challenge_verifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM challenges c
            JOIN clubs cl ON c.club_id = cl.id
            WHERE c.id = challenge_id AND 
            (cl.created_by = auth.uid() OR cl.is_sabo_owned = true)
        )
    );

-- Trigger to update challenge configuration when bet_points changes
CREATE OR REPLACE FUNCTION update_challenge_config()
RETURNS TRIGGER AS $$
DECLARE
    v_config RECORD;
BEGIN
    IF NEW.bet_points IS DISTINCT FROM OLD.bet_points THEN
        SELECT * INTO v_config FROM get_challenge_config(NEW.bet_points);
        
        NEW.race_to := v_config.race_to;
        NEW.handicap_1_rank := v_config.handicap_1_rank;
        NEW.handicap_05_rank := v_config.handicap_05_rank;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_challenge_config
    BEFORE INSERT OR UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_challenge_config(); 