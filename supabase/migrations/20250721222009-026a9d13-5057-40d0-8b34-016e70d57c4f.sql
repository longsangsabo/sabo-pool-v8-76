
-- Step 1: Add missing columns to existing tables
ALTER TABLE public.rank_requests 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Step 2: Update tournaments table to match interface expectations
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS tournament_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tournament_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS first_prize NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS second_prize NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS third_prize NUMERIC DEFAULT 0;

-- Copy data from existing columns if they exist
UPDATE public.tournaments 
SET tournament_start = start_date 
WHERE tournament_start IS NULL AND start_date IS NOT NULL;

UPDATE public.tournaments 
SET tournament_end = end_date 
WHERE tournament_end IS NULL AND end_date IS NOT NULL;

-- Step 3: Create missing tables
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID NOT NULL,
    player2_id UUID NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'scheduled',
    scheduled_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.elo_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    elo_change INTEGER NOT NULL,
    new_elo INTEGER NOT NULL,
    reason TEXT,
    match_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL,
    referred_id UUID,
    referral_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending',
    reward_claimed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.spa_reward_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_name TEXT NOT NULL,
    milestone_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL,
    spa_reward INTEGER NOT NULL,
    bonus_conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    is_repeatable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create missing function
CREATE OR REPLACE FUNCTION public.redeem_reward(
    user_uuid UUID,
    reward_type TEXT,
    reward_value TEXT,
    points_cost INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_spa INTEGER;
    result JSONB;
BEGIN
    -- Get current SPA points
    SELECT spa_points INTO current_spa 
    FROM player_rankings 
    WHERE user_id = user_uuid;
    
    -- Check if user has enough points
    IF current_spa < points_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Không đủ SPA points'
        );
    END IF;
    
    -- Deduct points
    UPDATE player_rankings 
    SET spa_points = spa_points - points_cost 
    WHERE user_id = user_uuid;
    
    -- Log the redemption
    INSERT INTO reward_redemptions (user_id, reward_type, points_cost, redemption_data)
    VALUES (user_uuid, reward_type, points_cost, jsonb_build_object('value', reward_value));
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Đổi thưởng thành công'
    );
END;
$$;

-- Step 5: Add RLS policies for new tables
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elo_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_reward_milestones ENABLE ROW LEVEL SECURITY;

-- Practice sessions policies
CREATE POLICY "Users can view their practice sessions" ON public.practice_sessions
FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can create practice sessions" ON public.practice_sessions
FOR INSERT WITH CHECK (auth.uid() = player1_id);

-- Elo history policies
CREATE POLICY "Users can view their elo history" ON public.elo_history
FOR SELECT USING (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Users can view their referrals" ON public.referrals
FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals" ON public.referrals
FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- SPA reward milestones policies
CREATE POLICY "Anyone can view active milestones" ON public.spa_reward_milestones
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage milestones" ON public.spa_reward_milestones
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND is_admin = true
    )
);

-- Step 6: Fix spa_points_log column name (points_earned -> points)
-- The table already has 'points' column, so we're good

-- Step 7: Update existing tournaments to have proper tournament_start/end values
UPDATE public.tournaments 
SET 
    tournament_start = COALESCE(tournament_start, start_date, created_at),
    tournament_end = COALESCE(tournament_end, end_date, created_at + interval '1 day')
WHERE tournament_start IS NULL OR tournament_end IS NULL;
