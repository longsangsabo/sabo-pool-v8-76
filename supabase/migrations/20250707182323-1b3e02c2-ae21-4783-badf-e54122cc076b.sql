-- GIẢI PHÁP TRIỆT ĐỂ: Tạo bảng riêng cho test users để tránh mọi trigger wallet

-- Kiểm tra xem còn trigger nào không
SELECT 
    trigger_name, 
    event_object_table,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
AND (action_statement ILIKE '%wallet%' OR trigger_name ILIKE '%wallet%' OR event_object_table = 'profiles');

-- Tạo bảng test_profiles riêng biệt hoàn toàn
CREATE TABLE IF NOT EXISTS public.test_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT,
    display_name TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'player',
    skill_level TEXT DEFAULT 'beginner',
    city TEXT,
    district TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_test_data BOOLEAN DEFAULT true
);

-- Bảng ranking riêng cho test users
CREATE TABLE IF NOT EXISTS public.test_player_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_profile_id UUID REFERENCES public.test_profiles(id) ON DELETE CASCADE,
    elo INTEGER DEFAULT 1000,
    spa_points INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS cho test tables
ALTER TABLE public.test_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_player_rankings ENABLE ROW_LEVEL SECURITY;

-- Cho phép admin xem và tạo test data
CREATE POLICY "Admins can manage test profiles" ON public.test_profiles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_admin = true
    )
);

CREATE POLICY "Admins can manage test rankings" ON public.test_player_rankings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_admin = true
    )
);

-- Đảm bảo KHÔNG có trigger nào trên test tables
-- Kiểm tra lại một lần nữa
SELECT 
    'NO TRIGGERS ON TEST TABLES' as message,
    COUNT(*) as trigger_count
FROM information_schema.triggers 
WHERE event_object_table IN ('test_profiles', 'test_player_rankings');