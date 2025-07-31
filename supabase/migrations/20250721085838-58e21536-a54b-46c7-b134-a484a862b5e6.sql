
-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro')) DEFAULT 'beginner';

-- Add missing column to rank_requests table
ALTER TABLE public.rank_requests 
ADD COLUMN IF NOT EXISTS club_id UUID;

-- Create club_profiles table that codebase is expecting
CREATE TABLE IF NOT EXISTS public.club_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    club_name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    description TEXT,
    contact_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_penalties table
CREATE TABLE IF NOT EXISTS public.user_penalties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    penalty_type TEXT NOT NULL,
    severity TEXT DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'severe')),
    reason TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    issued_by UUID REFERENCES public.profiles(user_id),
    appeal_status TEXT DEFAULT 'none' CHECK (appeal_status IN ('none', 'pending', 'approved', 'rejected')),
    appeal_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create favorite_opponents table
CREATE TABLE IF NOT EXISTS public.favorite_opponents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    opponent_user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    favorite_rank INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, opponent_user_id)
);

-- Create reward_redemptions table
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    reward_type TEXT NOT NULL,
    points_cost INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
    redemption_data JSONB DEFAULT '{}',
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_streaks table
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    streak_type TEXT NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    streak_start_date TIMESTAMP WITH TIME ZONE,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, streak_type)
);

-- Enable RLS for all new tables
ALTER TABLE public.club_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_opponents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for club_profiles
CREATE POLICY "Users can view their own club profiles"
ON public.club_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own club profiles"
ON public.club_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own club profiles"
ON public.club_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved club profiles"
ON public.club_profiles FOR SELECT
USING (verification_status = 'approved');

-- RLS Policies for user_penalties
CREATE POLICY "Users can view their own penalties"
ON public.user_penalties FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all penalties"
ON public.user_penalties FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

-- RLS Policies for favorite_opponents
CREATE POLICY "Users can manage their own favorite opponents"
ON public.favorite_opponents FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for reward_redemptions
CREATE POLICY "Users can view their own reward redemptions"
ON public.reward_redemptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reward redemptions"
ON public.reward_redemptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reward redemptions"
ON public.reward_redemptions FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

-- RLS Policies for user_streaks
CREATE POLICY "Users can view their own streaks"
ON public.user_streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage user streaks"
ON public.user_streaks FOR ALL
USING (true)
WITH CHECK (true);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_club_profiles_updated_at
    BEFORE UPDATE ON public.club_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_penalties_updated_at
    BEFORE UPDATE ON public.user_penalties
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_favorite_opponents_updated_at
    BEFORE UPDATE ON public.favorite_opponents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reward_redemptions_updated_at
    BEFORE UPDATE ON public.reward_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON public.user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for updating rank verification
CREATE OR REPLACE FUNCTION public.update_rank_verification_simple(
    p_request_id UUID,
    p_status TEXT,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.rank_requests
    SET 
        status = p_status,
        admin_notes = p_admin_notes,
        updated_at = NOW()
    WHERE id = p_request_id;
    
    RETURN FOUND;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_club_profiles_user_id ON public.club_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_club_profiles_verification_status ON public.club_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_user_penalties_user_id ON public.user_penalties(user_id);
CREATE INDEX IF NOT EXISTS idx_user_penalties_is_active ON public.user_penalties(is_active);
CREATE INDEX IF NOT EXISTS idx_favorite_opponents_user_id ON public.favorite_opponents(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON public.reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);
