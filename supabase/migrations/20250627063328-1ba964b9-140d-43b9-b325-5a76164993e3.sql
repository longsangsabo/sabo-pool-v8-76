
-- Bảng user_profiles (thông tin chi tiết user) - bổ sung thêm cho profiles hiện có
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Cập nhật bảng clubs hiện có với thêm thông tin
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS hourly_rate INTEGER;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS table_count INTEGER DEFAULT 0;

-- Bảng memberships (gói hội viên)
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    membership_type VARCHAR(20) DEFAULT 'free',
    price INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS cho memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- RLS policies cho memberships
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

-- Thêm dữ liệu mẫu cho clubs
UPDATE public.clubs SET hourly_rate = 50000, table_count = 8 WHERE name = 'CLB Hà Nội';
UPDATE public.clubs SET hourly_rate = 60000, table_count = 12 WHERE name = 'CLB Sài Gòn';
UPDATE public.clubs SET hourly_rate = 45000, table_count = 6 WHERE name = 'CLB Đà Nẵng';
UPDATE public.clubs SET hourly_rate = 40000, table_count = 10 WHERE name = 'CLB Cần Thơ';
