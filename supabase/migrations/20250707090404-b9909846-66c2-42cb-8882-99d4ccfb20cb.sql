-- Match Result Management System
-- Create match_results table for detailed match tracking
CREATE TABLE IF NOT EXISTS public.match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
    player1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    loser_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Score tracking
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_score INTEGER NOT NULL DEFAULT 0,
    total_frames INTEGER NOT NULL DEFAULT 1,
    match_format TEXT NOT NULL DEFAULT 'race_to_5', -- race_to_5, race_to_7, race_to_9, etc.
    
    -- ELO and ranking
    player1_elo_before INTEGER NOT NULL DEFAULT 1000,
    player2_elo_before INTEGER NOT NULL DEFAULT 1000,
    player1_elo_after INTEGER NOT NULL DEFAULT 1000,
    player2_elo_after INTEGER NOT NULL DEFAULT 1000,
    player1_elo_change INTEGER NOT NULL DEFAULT 0,
    player2_elo_change INTEGER NOT NULL DEFAULT 0,
    
    -- Result verification
    result_status TEXT NOT NULL DEFAULT 'pending', -- pending, verified, disputed, rejected
    verification_method TEXT DEFAULT 'manual', -- manual, qr_code, referee, auto
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    
    -- Player confirmations
    player1_confirmed BOOLEAN DEFAULT false,
    player2_confirmed BOOLEAN DEFAULT false,
    player1_confirmed_at TIMESTAMP WITH TIME ZONE,
    player2_confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Match details
    match_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    duration_minutes INTEGER, -- match duration in minutes
    club_id UUID REFERENCES public.club_profiles(id),
    referee_id UUID REFERENCES auth.users(id),
    
    -- Additional stats
    player1_stats JSONB DEFAULT '{}',
    player2_stats JSONB DEFAULT '{}',
    match_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_scores CHECK (player1_score >= 0 AND player2_score >= 0),
    CONSTRAINT valid_frames CHECK (total_frames > 0),
    CONSTRAINT valid_winner CHECK (
        (player1_score > player2_score AND winner_id = player1_id) OR
        (player2_score > player1_score AND winner_id = player2_id) OR
        (player1_score = player2_score AND winner_id IS NULL)
    )
);

-- Create match_disputes table for handling disputes
CREATE TABLE IF NOT EXISTS public.match_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_result_id UUID REFERENCES public.match_results(id) ON DELETE CASCADE,
    disputed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    dispute_reason TEXT NOT NULL,
    dispute_details TEXT,
    evidence_urls TEXT[],
    status TEXT NOT NULL DEFAULT 'open', -- open, investigating, resolved, rejected
    admin_response TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create elo_history table for tracking rating changes
CREATE TABLE IF NOT EXISTS public.elo_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    match_result_id UUID REFERENCES public.match_results(id) ON DELETE CASCADE,
    elo_before INTEGER NOT NULL,
    elo_after INTEGER NOT NULL,
    elo_change INTEGER NOT NULL,
    rank_before TEXT,
    rank_after TEXT,
    opponent_id UUID REFERENCES auth.users(id),
    opponent_elo INTEGER,
    match_result TEXT NOT NULL, -- win, loss, draw
    k_factor NUMERIC(5,2) NOT NULL DEFAULT 32.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ranking_snapshots table for historical ranking data
CREATE TABLE IF NOT EXISTS public.ranking_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    elo_rating INTEGER NOT NULL,
    rank_position INTEGER,
    rank_tier TEXT NOT NULL,
    total_matches INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    win_rate NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    peak_elo INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(player_id, snapshot_date)
);

-- Enable RLS on all tables
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elo_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for match_results
CREATE POLICY "Everyone can view match results" 
    ON public.match_results 
    FOR SELECT 
    USING (true);

CREATE POLICY "Players can create their own match results" 
    ON public.match_results 
    FOR INSERT 
    WITH CHECK (
        auth.uid() = player1_id OR 
        auth.uid() = player2_id OR 
        auth.uid() = referee_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Players can update their own match results" 
    ON public.match_results 
    FOR UPDATE 
    USING (
        auth.uid() = player1_id OR 
        auth.uid() = player2_id OR 
        auth.uid() = referee_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins can manage all match results" 
    ON public.match_results 
    FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Create RLS policies for match_disputes
CREATE POLICY "Users can view disputes they're involved in" 
    ON public.match_disputes 
    FOR SELECT 
    USING (
        auth.uid() = disputed_by OR
        EXISTS (
            SELECT 1 FROM public.match_results mr 
            WHERE mr.id = match_result_id 
            AND (mr.player1_id = auth.uid() OR mr.player2_id = auth.uid())
        ) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Players can create disputes for their matches" 
    ON public.match_disputes 
    FOR INSERT 
    WITH CHECK (
        auth.uid() = disputed_by AND
        EXISTS (
            SELECT 1 FROM public.match_results mr 
            WHERE mr.id = match_result_id 
            AND (mr.player1_id = auth.uid() OR mr.player2_id = auth.uid())
        )
    );

CREATE POLICY "Admins can manage all disputes" 
    ON public.match_disputes 
    FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Create RLS policies for elo_history
CREATE POLICY "Users can view their own ELO history" 
    ON public.elo_history 
    FOR SELECT 
    USING (auth.uid() = player_id);

CREATE POLICY "Everyone can view ELO history" 
    ON public.elo_history 
    FOR SELECT 
    USING (true);

CREATE POLICY "System can create ELO history" 
    ON public.elo_history 
    FOR INSERT 
    WITH CHECK (true);

-- Create RLS policies for ranking_snapshots
CREATE POLICY "Everyone can view ranking snapshots" 
    ON public.ranking_snapshots 
    FOR SELECT 
    USING (true);

CREATE POLICY "System can manage ranking snapshots" 
    ON public.ranking_snapshots 
    FOR ALL 
    USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON public.match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_player1_id ON public.match_results(player1_id);
CREATE INDEX IF NOT EXISTS idx_match_results_player2_id ON public.match_results(player2_id);
CREATE INDEX IF NOT EXISTS idx_match_results_match_date ON public.match_results(match_date);
CREATE INDEX IF NOT EXISTS idx_match_results_status ON public.match_results(result_status);
CREATE INDEX IF NOT EXISTS idx_match_disputes_match_result_id ON public.match_disputes(match_result_id);
CREATE INDEX IF NOT EXISTS idx_elo_history_player_id ON public.elo_history(player_id);
CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_player_id ON public.ranking_snapshots(player_id);
CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_date ON public.ranking_snapshots(snapshot_date);

-- Create function to calculate and update ELO ratings
CREATE OR REPLACE FUNCTION public.calculate_match_elo(
    p_match_result_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_match_result RECORD;
    v_player1_profile RECORD;
    v_player2_profile RECORD;
    v_k_factor1 NUMERIC;
    v_k_factor2 NUMERIC;
    v_expected_score1 NUMERIC;
    v_expected_score2 NUMERIC;
    v_actual_score1 NUMERIC;
    v_actual_score2 NUMERIC;
    v_elo_change1 INTEGER;
    v_elo_change2 INTEGER;
    v_new_elo1 INTEGER;
    v_new_elo2 INTEGER;
    v_result JSONB;
BEGIN
    -- Get match result details
    SELECT * INTO v_match_result 
    FROM public.match_results 
    WHERE id = p_match_result_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Match result not found');
    END IF;
    
    -- Get player profiles with ELO ratings
    SELECT p.*, COALESCE(pr.elo, 1000) as current_elo, COALESCE(pr.total_matches, 0) as total_matches
    INTO v_player1_profile
    FROM public.profiles p
    LEFT JOIN public.player_rankings pr ON pr.player_id = p.user_id
    WHERE p.user_id = v_match_result.player1_id;
    
    SELECT p.*, COALESCE(pr.elo, 1000) as current_elo, COALESCE(pr.total_matches, 0) as total_matches
    INTO v_player2_profile
    FROM public.profiles p
    LEFT JOIN public.player_rankings pr ON pr.player_id = p.user_id
    WHERE p.user_id = v_match_result.player2_id;
    
    -- Calculate K-factors based on experience
    v_k_factor1 := CASE 
        WHEN v_player1_profile.total_matches < 30 THEN 40
        WHEN v_player1_profile.current_elo >= 2400 THEN 16
        WHEN v_player1_profile.current_elo >= 2100 THEN 24
        ELSE 32
    END;
    
    v_k_factor2 := CASE 
        WHEN v_player2_profile.total_matches < 30 THEN 40
        WHEN v_player2_profile.current_elo >= 2400 THEN 16
        WHEN v_player2_profile.current_elo >= 2100 THEN 24
        ELSE 32
    END;
    
    -- Calculate expected scores
    v_expected_score1 := 1.0 / (1.0 + POWER(10, (v_player2_profile.current_elo - v_player1_profile.current_elo) / 400.0));
    v_expected_score2 := 1.0 - v_expected_score1;
    
    -- Calculate actual scores
    v_actual_score1 := CASE 
        WHEN v_match_result.winner_id = v_match_result.player1_id THEN 1.0
        WHEN v_match_result.winner_id = v_match_result.player2_id THEN 0.0
        ELSE 0.5 -- Draw
    END;
    v_actual_score2 := 1.0 - v_actual_score1;
    
    -- Calculate ELO changes
    v_elo_change1 := ROUND(v_k_factor1 * (v_actual_score1 - v_expected_score1));
    v_elo_change2 := ROUND(v_k_factor2 * (v_actual_score2 - v_expected_score2));
    
    -- Calculate new ELO ratings
    v_new_elo1 := v_player1_profile.current_elo + v_elo_change1;
    v_new_elo2 := v_player2_profile.current_elo + v_elo_change2;
    
    -- Update match result with ELO data
    UPDATE public.match_results
    SET 
        player1_elo_before = v_player1_profile.current_elo,
        player2_elo_before = v_player2_profile.current_elo,
        player1_elo_after = v_new_elo1,
        player2_elo_after = v_new_elo2,
        player1_elo_change = v_elo_change1,
        player2_elo_change = v_elo_change2,
        updated_at = NOW()
    WHERE id = p_match_result_id;
    
    -- Update player rankings
    INSERT INTO public.player_rankings (player_id, elo, total_matches, wins, losses, updated_at)
    VALUES (
        v_match_result.player1_id, 
        v_new_elo1, 
        v_player1_profile.total_matches + 1,
        v_player1_profile.total_matches + CASE WHEN v_match_result.winner_id = v_match_result.player1_id THEN 1 ELSE 0 END,
        v_player1_profile.total_matches + CASE WHEN v_match_result.winner_id = v_match_result.player2_id THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (player_id) DO UPDATE SET
        elo = EXCLUDED.elo,
        total_matches = player_rankings.total_matches + 1,
        wins = player_rankings.wins + CASE WHEN v_match_result.winner_id = v_match_result.player1_id THEN 1 ELSE 0 END,
        losses = player_rankings.losses + CASE WHEN v_match_result.winner_id = v_match_result.player2_id THEN 1 ELSE 0 END,
        updated_at = NOW();
    
    INSERT INTO public.player_rankings (player_id, elo, total_matches, wins, losses, updated_at)
    VALUES (
        v_match_result.player2_id, 
        v_new_elo2, 
        v_player2_profile.total_matches + 1,
        v_player2_profile.total_matches + CASE WHEN v_match_result.winner_id = v_match_result.player2_id THEN 1 ELSE 0 END,
        v_player2_profile.total_matches + CASE WHEN v_match_result.winner_id = v_match_result.player1_id THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (player_id) DO UPDATE SET
        elo = EXCLUDED.elo,
        total_matches = player_rankings.total_matches + 1,
        wins = player_rankings.wins + CASE WHEN v_match_result.winner_id = v_match_result.player2_id THEN 1 ELSE 0 END,
        losses = player_rankings.losses + CASE WHEN v_match_result.winner_id = v_match_result.player1_id THEN 1 ELSE 0 END,
        updated_at = NOW();
    
    -- Create ELO history records
    INSERT INTO public.elo_history (
        player_id, match_result_id, elo_before, elo_after, elo_change,
        opponent_id, opponent_elo, match_result, k_factor
    ) VALUES
    (
        v_match_result.player1_id, p_match_result_id, 
        v_player1_profile.current_elo, v_new_elo1, v_elo_change1,
        v_match_result.player2_id, v_player2_profile.current_elo,
        CASE 
            WHEN v_match_result.winner_id = v_match_result.player1_id THEN 'win'
            WHEN v_match_result.winner_id = v_match_result.player2_id THEN 'loss'
            ELSE 'draw'
        END,
        v_k_factor1
    ),
    (
        v_match_result.player2_id, p_match_result_id,
        v_player2_profile.current_elo, v_new_elo2, v_elo_change2,
        v_match_result.player1_id, v_player1_profile.current_elo,
        CASE 
            WHEN v_match_result.winner_id = v_match_result.player2_id THEN 'win'
            WHEN v_match_result.winner_id = v_match_result.player1_id THEN 'loss'
            ELSE 'draw'
        END,
        v_k_factor2
    );
    
    -- Build result
    v_result := jsonb_build_object(
        'success', true,
        'player1_elo_change', v_elo_change1,
        'player2_elo_change', v_elo_change2,
        'player1_new_elo', v_new_elo1,
        'player2_new_elo', v_new_elo2,
        'expected_score1', v_expected_score1,
        'expected_score2', v_expected_score2,
        'k_factor1', v_k_factor1,
        'k_factor2', v_k_factor2
    );
    
    RETURN v_result;
END;
$$;

-- Create function to verify match result
CREATE OR REPLACE FUNCTION public.verify_match_result(
    p_match_result_id UUID,
    p_verifier_id UUID,
    p_verification_method TEXT DEFAULT 'manual'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_match_result RECORD;
    v_result JSONB;
BEGIN
    -- Get match result
    SELECT * INTO v_match_result 
    FROM public.match_results 
    WHERE id = p_match_result_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Match result not found');
    END IF;
    
    -- Check if both players have confirmed
    IF NOT (v_match_result.player1_confirmed AND v_match_result.player2_confirmed) THEN
        RETURN jsonb_build_object('error', 'Both players must confirm the result first');
    END IF;
    
    -- Update verification status
    UPDATE public.match_results
    SET 
        result_status = 'verified',
        verification_method = p_verification_method,
        verified_at = NOW(),
        verified_by = p_verifier_id,
        updated_at = NOW()
    WHERE id = p_match_result_id;
    
    -- Calculate and update ELO ratings
    SELECT public.calculate_match_elo(p_match_result_id) INTO v_result;
    
    -- Create notifications for players
    INSERT INTO public.notifications (user_id, type, title, message, priority)
    VALUES 
    (v_match_result.player1_id, 'match_verified', 'Kết quả trận đấu đã được xác thực', 
     'Kết quả trận đấu của bạn đã được xác thực và ELO đã được cập nhật.', 'normal'),
    (v_match_result.player2_id, 'match_verified', 'Kết quả trận đấu đã được xác thực', 
     'Kết quả trận đấu của bạn đã được xác thực và ELO đã được cập nhật.', 'normal');
    
    RETURN jsonb_build_object('success', true, 'elo_calculation', v_result);
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_match_results_updated_at
    BEFORE UPDATE ON public.match_results
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_match_disputes_updated_at
    BEFORE UPDATE ON public.match_disputes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.match_results REPLICA IDENTITY FULL;
ALTER TABLE public.match_disputes REPLICA IDENTITY FULL;
ALTER TABLE public.elo_history REPLICA IDENTITY FULL;
ALTER TABLE public.ranking_snapshots REPLICA IDENTITY FULL;