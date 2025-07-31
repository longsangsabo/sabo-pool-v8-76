
-- Create provinces table for location filtering
CREATE TABLE IF NOT EXISTS public.provinces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    region VARCHAR(50), -- north, central, south
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Vietnam provinces
INSERT INTO public.provinces (name, code, region) VALUES
-- North
('Hà Nội', 'HN', 'north'),
('Hải Phòng', 'HP', 'north'),
('Quảng Ninh', 'QN', 'north'),
('Thái Nguyên', 'TN', 'north'),
('Vĩnh Phúc', 'VP', 'north'),
-- Central
('Đà Nẵng', 'DN', 'central'),
('Huế', 'HUE', 'central'),
('Quảng Nam', 'QNM', 'central'),
('Khánh Hòa', 'KH', 'central'),
('Lâm Đồng', 'LD', 'central'),
-- South
('TP. Hồ Chí Minh', 'HCM', 'south'),
('Bình Dương', 'BD', 'south'),
('Đồng Nai', 'DNI', 'south'),
('Cần Thơ', 'CT', 'south'),
('An Giang', 'AG', 'south');

-- Add province_id to profiles and clubs for location filtering
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS province_id UUID REFERENCES public.provinces(id);
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS province_id UUID REFERENCES public.provinces(id);
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Update tournaments table with additional fields
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS first_prize_percent INTEGER DEFAULT 50;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS second_prize_percent INTEGER DEFAULT 30;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS third_prize_percent INTEGER DEFAULT 20;

-- Update existing data with sample provinces (for demo purposes)
UPDATE public.profiles SET province_id = (SELECT id FROM public.provinces WHERE code = 'HCM' LIMIT 1) 
WHERE id IN (SELECT id FROM public.profiles ORDER BY created_at LIMIT 5);

UPDATE public.profiles SET province_id = (SELECT id FROM public.provinces WHERE code = 'HN' LIMIT 1) 
WHERE id IN (SELECT id FROM public.profiles ORDER BY created_at LIMIT 3 OFFSET 5);

UPDATE public.profiles SET province_id = (SELECT id FROM public.provinces WHERE code = 'DN' LIMIT 1) 
WHERE id IN (SELECT id FROM public.profiles ORDER BY created_at LIMIT 2 OFFSET 8);

-- Update clubs with provinces
UPDATE public.clubs SET province_id = (SELECT id FROM public.provinces WHERE code = 'HCM' LIMIT 1) 
WHERE name LIKE '%Sài Gòn%';

UPDATE public.clubs SET province_id = (SELECT id FROM public.provinces WHERE code = 'HN' LIMIT 1) 
WHERE name LIKE '%Hà Nội%';

UPDATE public.clubs SET province_id = (SELECT id FROM public.provinces WHERE code = 'DN' LIMIT 1) 
WHERE name LIKE '%Đà Nẵng%';

-- Insert sample match data for match history
INSERT INTO public.matches (tournament_id, player1_id, player2_id, winner_id, score_player1, score_player2, match_date, status, round_number, match_number) 
SELECT 
    (SELECT id FROM public.tournaments LIMIT 1),
    p1.user_id,
    p2.user_id,
    p1.user_id,
    3,
    1,
    NOW() - INTERVAL '2 days',
    'completed',
    1,
    1
FROM (SELECT user_id FROM public.profiles LIMIT 1 OFFSET 0) p1,
     (SELECT user_id FROM public.profiles LIMIT 1 OFFSET 1) p2;

-- Insert match statistics for the sample match
INSERT INTO public.match_statistics (match_id, player_id, total_shots, successful_shots, safety_shots, break_shots, longest_run, fouls_committed, time_at_table_seconds, average_shot_time, pressure_situations, pressure_success, match_duration_minutes)
SELECT 
    m.id,
    m.player1_id,
    45,
    32,
    8,
    3,
    7,
    2,
    1800,
    25.5,
    5,
    3,
    45
FROM public.matches m WHERE m.status = 'completed' LIMIT 1;

-- Enable RLS for provinces
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;

-- RLS policy for provinces (public read)
CREATE POLICY "Anyone can view provinces" 
    ON public.provinces 
    FOR SELECT 
    USING (true);
