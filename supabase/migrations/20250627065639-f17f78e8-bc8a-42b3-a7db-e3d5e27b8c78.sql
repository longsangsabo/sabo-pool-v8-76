
-- Enable RLS cho các tables (IF NOT EXISTS equivalent)
DO $$
BEGIN
    -- Check và enable RLS cho profiles nếu chưa có
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Check và enable RLS cho memberships nếu chưa có  
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'memberships' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Check và enable RLS cho clubs nếu chưa có
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'clubs' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Drop và recreate policies để đảm bảo consistency
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
    ON public.profiles 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- RLS Policies cho memberships table
DROP POLICY IF EXISTS "Users can view their own membership" ON public.memberships;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.memberships;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.memberships;

CREATE POLICY "Users can view their own membership" 
    ON public.memberships 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own membership" 
    ON public.memberships 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" 
    ON public.memberships 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- RLS Policies cho clubs table (public read access)
DROP POLICY IF EXISTS "Anyone can view clubs" ON public.clubs;
CREATE POLICY "Anyone can view clubs" 
    ON public.clubs 
    FOR SELECT 
    USING (true);

-- RLS Policies cho tournaments table
DROP POLICY IF EXISTS "Anyone can view tournaments" ON public.tournaments;
CREATE POLICY "Anyone can view tournaments" 
    ON public.tournaments 
    FOR SELECT 
    USING (true);

-- RLS Policies cho matches table
DROP POLICY IF EXISTS "Users can view matches they participate in" ON public.matches;
DROP POLICY IF EXISTS "Users can view public matches" ON public.matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON public.matches;

CREATE POLICY "Users can view public matches" 
    ON public.matches 
    FOR SELECT 
    USING (true);

CREATE POLICY "Users can update their own matches" 
    ON public.matches 
    FOR UPDATE 
    USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Tạo indexes để optimize performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_players ON public.matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON public.tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ranking_history_user_id ON public.ranking_history(user_id);

-- Tạo function để update ranking points an cách an toàn
CREATE OR REPLACE FUNCTION update_user_ranking(
    user_uuid UUID,
    new_rank VARCHAR(10),
    new_points INTEGER,
    reason_text TEXT
)
RETURNS VOID AS $$
DECLARE
    old_rank_val VARCHAR(10);
    old_points_val INTEGER;
BEGIN
    -- Lấy thông tin ranking hiện tại
    SELECT current_rank, ranking_points 
    INTO old_rank_val, old_points_val
    FROM public.profiles 
    WHERE user_id = user_uuid;
    
    -- Cập nhật ranking mới
    UPDATE public.profiles 
    SET 
        current_rank = new_rank,
        ranking_points = new_points,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- Lưu lịch sử thay đổi ranking
    INSERT INTO public.ranking_history (
        user_id, 
        old_rank, 
        new_rank, 
        old_points, 
        new_points, 
        reason
    ) VALUES (
        user_uuid,
        old_rank_val,
        new_rank,
        old_points_val,
        new_points,
        reason_text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
