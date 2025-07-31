-- =====================================================
-- FIX MISSING TABLES - PHASE 1: CORE TABLES
-- =====================================================

-- Create ranks table for rank system (fixed structure)
CREATE TABLE IF NOT EXISTS public.ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL UNIQUE,
  color TEXT,
  min_elo_points INTEGER DEFAULT 0,
  description TEXT,
  requirements JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default ranks
INSERT INTO public.ranks (name, code, level, color, min_elo_points, description) VALUES
('Kỷ lục', 'K', 1, '#808080', 0, 'Hạng mới bắt đầu'),
('F', 'F', 2, '#8B4513', 800, 'Hạng F'),
('F+', 'F+', 3, '#A0522D', 900, 'Hạng F+'),
('E', 'E', 4, '#DAA520', 1000, 'Hạng E'),
('E+', 'E+', 5, '#FFD700', 1200, 'Hạng E+'),
('D', 'D', 6, '#32CD32', 1400, 'Hạng D'),
('D+', 'D+', 7, '#228B22', 1600, 'Hạng D+'),
('C', 'C', 8, '#4169E1', 1800, 'Hạng C'),
('C+', 'C+', 9, '#0000FF', 2000, 'Hạng C+'),
('B', 'B', 10, '#8A2BE2', 2200, 'Hạng B'),
('B+', 'B+', 11, '#9400D3', 2400, 'Hạng B+'),
('A', 'A', 12, '#FF1493', 2600, 'Hạng A'),
('A+', 'A+', 13, '#DC143C', 2800, 'Hạng A+'),
('Pro', 'PRO', 14, '#B22222', 3000, 'Hạng chuyên nghiệp')
ON CONFLICT (code) DO NOTHING;

-- Create wallets table for user wallet system
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  points_balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create SPA points transaction log
CREATE TABLE IF NOT EXISTS public.spa_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  points_spent INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  description TEXT,
  match_id UUID,
  tournament_id UUID,
  challenge_id UUID,
  source_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create SPA reward milestones table
CREATE TABLE IF NOT EXISTS public.spa_reward_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_name TEXT NOT NULL,
  milestone_description TEXT,
  milestone_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  spa_reward INTEGER NOT NULL,
  badge_icon TEXT,
  badge_color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default milestones
INSERT INTO public.spa_reward_milestones (milestone_name, milestone_description, milestone_type, requirement_value, spa_reward, badge_icon, badge_color) VALUES
('Tân binh', 'Hoàn thành 5 trận đấu đầu tiên', 'matches_played', 5, 100, '🏓', '#22c55e'),
('Người bền bỉ', 'Hoàn thành 25 trận đấu', 'matches_played', 25, 250, '💪', '#3b82f6'),
('Chiến binh', 'Hoàn thành 50 trận đấu', 'matches_played', 50, 500, '⚔️', '#8b5cf6'),
('Cao thủ', 'Hoàn thành 100 trận đấu', 'matches_played', 100, 1000, '🏆', '#f59e0b'),
('Thắng lợi đầu tiên', 'Đạt tỷ lệ thắng 50% với ít nhất 10 trận', 'win_rate', 10, 200, '🎯', '#10b981'),
('Chuỗi thắng', 'Đạt chuỗi thắng 5 trận liên tiếp', 'win_streak', 5, 300, '🔥', '#ef4444'),
('Thợ săn điểm', 'Đạt 1000 SPA Points', 'spa_points', 1000, 100, '💎', '#6366f1'),
('Vua SPA', 'Đạt 5000 SPA Points', 'spa_points', 5000, 500, '👑', '#ec4899')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES FOR CORE TABLES
-- =====================================================

-- Enable RLS
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_reward_milestones ENABLE ROW LEVEL SECURITY;

-- Ranks policies
CREATE POLICY "Anyone can view active ranks" ON public.ranks FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage ranks" ON public.ranks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Wallets policies
CREATE POLICY "Users can view their own wallet" ON public.wallets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can manage wallets" ON public.wallets FOR ALL WITH CHECK (true);

-- SPA points log policies
CREATE POLICY "Users can view their own SPA points log" ON public.spa_points_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can manage SPA points log" ON public.spa_points_log FOR ALL WITH CHECK (true);

-- SPA reward milestones policies
CREATE POLICY "Anyone can view active milestones" ON public.spa_reward_milestones FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage milestones" ON public.spa_reward_milestones FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_spa_points_log_user_id ON public.spa_points_log(user_id);
CREATE INDEX IF NOT EXISTS idx_spa_points_log_category ON public.spa_points_log(category);

-- =====================================================
-- CONSTRAINTS AND VALIDATION
-- =====================================================

ALTER TABLE public.wallets ADD CONSTRAINT IF NOT EXISTS wallets_balance_non_negative CHECK (points_balance >= 0);
ALTER TABLE public.spa_points_log ADD CONSTRAINT IF NOT EXISTS spa_points_log_values_valid CHECK (points_earned >= 0 AND points_spent >= 0);
ALTER TABLE public.spa_reward_milestones ADD CONSTRAINT IF NOT EXISTS milestones_requirement_positive CHECK (requirement_value > 0);
ALTER TABLE public.spa_reward_milestones ADD CONSTRAINT IF NOT EXISTS milestones_reward_positive CHECK (spa_reward > 0);

-- Add foreign key constraint for spa_points_log
ALTER TABLE public.spa_points_log 
ADD CONSTRAINT IF NOT EXISTS spa_points_log_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;