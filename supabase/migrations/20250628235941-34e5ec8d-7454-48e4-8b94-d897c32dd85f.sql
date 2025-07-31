
-- Cập nhật bảng tournaments với các trường mới
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS tournament_type VARCHAR(50) DEFAULT 'single_elimination';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS game_format VARCHAR(50) DEFAULT '8_ball';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS registration_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS venue_address TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS first_prize INTEGER DEFAULT 0;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS second_prize INTEGER DEFAULT 0;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS third_prize INTEGER DEFAULT 0;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS banner_image TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS contact_info JSONB;

-- Tạo bảng user_club_interactions để theo dõi tương tác người dùng với CLB
CREATE TABLE IF NOT EXISTS public.user_club_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  club_id UUID REFERENCES public.clubs(id) NOT NULL,
  
  -- Interaction Types
  interaction_type VARCHAR(50) NOT NULL, -- 'tournament_join', 'match_played', 'check_in', 'review', 'favorite'
  interaction_count INTEGER DEFAULT 1,
  
  -- Scoring for recommendation
  interaction_score INTEGER DEFAULT 0, -- Điểm tương tác tích lũy
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB, -- Thông tin bổ sung về tương tác
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, club_id, interaction_type)
);

-- Tạo bảng user_locations để lưu vị trí người dùng
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Location Data
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  city TEXT,
  district TEXT,
  
  -- Preferences
  max_distance_km INTEGER DEFAULT 20, -- Khoảng cách tối đa sẵn sàng di chuyển
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS cho các bảng mới
ALTER TABLE public.user_club_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies cho user_club_interactions
CREATE POLICY "Users can view their own interactions" 
    ON public.user_club_interactions 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" 
    ON public.user_club_interactions 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" 
    ON public.user_club_interactions 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- RLS policies cho user_locations
CREATE POLICY "Users can view their own location" 
    ON public.user_locations 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location" 
    ON public.user_locations 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location" 
    ON public.user_locations 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Tạo function để tăng điểm tương tác
CREATE OR REPLACE FUNCTION increment_interaction(
    p_user_id UUID,
    p_club_id UUID,
    p_interaction_type VARCHAR(50),
    p_score_increment INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_club_interactions 
    SET 
        interaction_count = interaction_count + 1,
        interaction_score = interaction_score + p_score_increment,
        last_interaction = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id 
    AND club_id = p_club_id 
    AND interaction_type = p_interaction_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tạo indexes để tối ưu hiệu suất
CREATE INDEX IF NOT EXISTS idx_user_club_interactions_user_id ON public.user_club_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_club_interactions_club_id ON public.user_club_interactions(club_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status_start ON public.tournaments(status, start_date);
