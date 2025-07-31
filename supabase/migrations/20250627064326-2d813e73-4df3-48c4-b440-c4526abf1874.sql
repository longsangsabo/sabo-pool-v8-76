
-- Tạo bảng tournaments (giải đấu)
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    club_id UUID REFERENCES public.clubs(id),
    min_rank VARCHAR(10) DEFAULT 'K1',
    max_rank VARCHAR(10) DEFAULT 'G+',
    max_participants INTEGER DEFAULT 32,
    current_participants INTEGER DEFAULT 0,
    prize_pool INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS cho tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- RLS policy cho tournaments (public read)
CREATE POLICY "Anyone can view tournaments" 
    ON public.tournaments 
    FOR SELECT 
    TO authenticated
    USING (true);

-- Thêm sample tournaments sử dụng club ID thực tế từ bảng clubs
INSERT INTO public.tournaments (name, description, start_date, end_date, club_id, min_rank, max_rank, max_participants, current_participants, prize_pool, status) 
SELECT 
    'Giải Bida Mở Rộng Tháng 1',
    'Giải đấu lớn nhất tháng với sự tham gia của các cao thủ',
    '2025-01-15 09:00:00+07',
    '2025-01-16 18:00:00+07',
    id,
    'A1',
    'B5',
    32,
    24,
    5000000,
    'upcoming'
FROM public.clubs WHERE name = 'CLB Sài Gòn' LIMIT 1;

INSERT INTO public.tournaments (name, description, start_date, end_date, club_id, min_rank, max_rank, max_participants, current_participants, prize_pool, status) 
SELECT 
    'Giải Vô Địch CLB Hà Nội',
    'Giải đấu nội bộ CLB Hà Nội',
    '2025-01-22 08:00:00+07',
    '2025-01-22 20:00:00+07',
    id,
    'K1',
    'A5',
    24,
    16,
    3000000,
    'upcoming'
FROM public.clubs WHERE name = 'CLB Hà Nội' LIMIT 1;

INSERT INTO public.tournaments (name, description, start_date, end_date, club_id, min_rank, max_rank, max_participants, current_participants, prize_pool, status) 
SELECT 
    'Giải Bida Miền Trung',
    'Giải đấu khu vực miền Trung',
    '2025-02-01 10:00:00+07',
    '2025-02-02 17:00:00+07',
    id,
    'B1',
    'G+',
    16,
    8,
    2000000,
    'upcoming'
FROM public.clubs WHERE name = 'CLB Đà Nẵng' LIMIT 1;

-- Tạo bảng matches (trận đấu)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id),
    player1_id UUID REFERENCES auth.users(id),
    player2_id UUID REFERENCES auth.users(id),
    winner_id UUID REFERENCES auth.users(id),
    score_player1 INTEGER DEFAULT 0,
    score_player2 INTEGER DEFAULT 0,
    match_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS cho matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- RLS policy cho matches
CREATE POLICY "Users can view matches they participate in" 
    ON public.matches 
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = player1_id OR auth.uid() = player2_id OR true);

-- Tạo bảng ranking_history (lịch sử ranking)
CREATE TABLE IF NOT EXISTS public.ranking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    old_rank VARCHAR(10),
    new_rank VARCHAR(10),
    old_points INTEGER DEFAULT 0,
    new_points INTEGER DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS cho ranking_history
ALTER TABLE public.ranking_history ENABLE ROW LEVEL SECURITY;

-- RLS policy cho ranking_history
CREATE POLICY "Users can view their own ranking history" 
    ON public.ranking_history 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Thêm columns cho profiles để lưu ranking info
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_rank VARCHAR(10) DEFAULT 'K1';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ranking_points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS matches_won INTEGER DEFAULT 0;
