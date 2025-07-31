-- =====================================================
-- COMPREHENSIVE DATABASE MIGRATION FOR MISSING TABLES
-- =====================================================

-- Create ranks table for rank system
CREATE TABLE IF NOT EXISTS public.ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_name TEXT NOT NULL UNIQUE,
  rank_code TEXT NOT NULL UNIQUE,
  rank_level INTEGER NOT NULL UNIQUE,
  rank_color TEXT,
  min_elo_points INTEGER DEFAULT 0,
  rank_description TEXT,
  rank_requirements JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default ranks
INSERT INTO public.ranks (rank_name, rank_code, rank_level, rank_color, min_elo_points, rank_description) VALUES
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
ON CONFLICT (rank_code) DO NOTHING;

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

-- Create rank_verifications table (comprehensive rank verification system)
CREATE TABLE IF NOT EXISTS public.rank_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  club_id UUID NOT NULL,
  instructor_id UUID,
  requested_rank TEXT NOT NULL,
  current_rank TEXT,
  verification_status TEXT DEFAULT 'pending',
  application_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verification_date TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  application_notes TEXT,
  club_notes TEXT,
  admin_notes TEXT,
  test_score INTEGER,
  test_date TIMESTAMP WITH TIME ZONE,
  test_location TEXT,
  certificate_number TEXT,
  certificate_url TEXT,
  video_evidence_url TEXT,
  payment_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  strengths TEXT[] DEFAULT '{}',
  areas_for_improvement TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rank_requests table (simplified rank request system)
CREATE TABLE IF NOT EXISTS public.rank_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  club_id UUID NOT NULL,
  current_rank TEXT,
  requested_rank TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID
);

-- Create test_schedules table for rank testing
CREATE TABLE IF NOT EXISTS public.test_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL,
  instructor_id UUID NOT NULL,
  test_rank TEXT NOT NULL,
  test_date TIMESTAMP WITH TIME ZONE NOT NULL,
  test_location TEXT,
  max_participants INTEGER DEFAULT 10,
  current_participants INTEGER DEFAULT 0,
  test_fee NUMERIC DEFAULT 0,
  requirements JSONB DEFAULT '{}',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rank_test_results table for test results
CREATE TABLE IF NOT EXISTS public.rank_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  test_schedule_id UUID NOT NULL,
  rank_verification_id UUID,
  test_score INTEGER,
  test_result TEXT,
  examiner_notes TEXT,
  passed BOOLEAN DEFAULT false,
  test_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tournament_automation_log table for tournament automation tracking
CREATE TABLE IF NOT EXISTS public.tournament_automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL,
  match_id UUID,
  automation_type TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create user_chat_sessions table for chat functionality
CREATE TABLE IF NOT EXISTS public.user_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_title TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_reward_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_automation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chat_sessions ENABLE ROW LEVEL SECURITY;

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

-- Rank verifications policies
CREATE POLICY "Users can view their own rank verifications" ON public.rank_verifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Club owners can view verifications for their club" ON public.rank_verifications FOR SELECT USING (
  club_id IN (SELECT id FROM club_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create rank verifications" ON public.rank_verifications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Club owners can update verifications for their club" ON public.rank_verifications FOR UPDATE USING (
  club_id IN (SELECT id FROM club_profiles WHERE user_id = auth.uid())
);

-- Rank requests policies
CREATE POLICY "Users can view their own rank requests" ON public.rank_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Club owners can view requests for their club" ON public.rank_requests FOR SELECT USING (
  club_id IN (SELECT id FROM club_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create rank requests" ON public.rank_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Club owners can update requests for their club" ON public.rank_requests FOR UPDATE USING (
  club_id IN (SELECT id FROM club_profiles WHERE user_id = auth.uid())
);

-- Test schedules policies
CREATE POLICY "Anyone can view test schedules" ON public.test_schedules FOR SELECT USING (status = 'open');
CREATE POLICY "Club owners can manage their test schedules" ON public.test_schedules FOR ALL USING (
  club_id IN (SELECT id FROM club_profiles WHERE user_id = auth.uid())
);

-- Rank test results policies
CREATE POLICY "Users can view their own test results" ON public.rank_test_results FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Club instructors can manage test results" ON public.rank_test_results FOR ALL USING (
  test_schedule_id IN (
    SELECT ts.id FROM test_schedules ts 
    JOIN club_profiles cp ON ts.club_id = cp.id 
    WHERE cp.user_id = auth.uid()
  )
);

-- Tournament automation log policies
CREATE POLICY "Admins can view all automation logs" ON public.tournament_automation_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
);
CREATE POLICY "System can insert automation logs" ON public.tournament_automation_log FOR INSERT WITH CHECK (true);

-- User chat sessions policies
CREATE POLICY "Users can manage their own chat sessions" ON public.user_chat_sessions FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraints where applicable
ALTER TABLE public.rank_verifications 
ADD CONSTRAINT fk_rank_verifications_club_id 
FOREIGN KEY (club_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.rank_verifications 
ADD CONSTRAINT fk_rank_verifications_instructor_id 
FOREIGN KEY (instructor_id) REFERENCES public.club_instructors(id) ON DELETE SET NULL;

ALTER TABLE public.rank_requests 
ADD CONSTRAINT fk_rank_requests_club_id 
FOREIGN KEY (club_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.test_schedules 
ADD CONSTRAINT fk_test_schedules_club_id 
FOREIGN KEY (club_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.test_schedules 
ADD CONSTRAINT fk_test_schedules_instructor_id 
FOREIGN KEY (instructor_id) REFERENCES public.club_instructors(id) ON DELETE CASCADE;

ALTER TABLE public.rank_test_results 
ADD CONSTRAINT fk_rank_test_results_schedule_id 
FOREIGN KEY (test_schedule_id) REFERENCES public.test_schedules(id) ON DELETE CASCADE;

ALTER TABLE public.rank_test_results 
ADD CONSTRAINT fk_rank_test_results_verification_id 
FOREIGN KEY (rank_verification_id) REFERENCES public.rank_verifications(id) ON DELETE SET NULL;

ALTER TABLE public.spa_points_log 
ADD CONSTRAINT spa_points_log_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_spa_points_log_user_id ON public.spa_points_log(user_id);
CREATE INDEX IF NOT EXISTS idx_spa_points_log_category ON public.spa_points_log(category);
CREATE INDEX IF NOT EXISTS idx_rank_verifications_user_id ON public.rank_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_verifications_club_id ON public.rank_verifications(club_id);
CREATE INDEX IF NOT EXISTS idx_rank_verifications_status ON public.rank_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_rank_requests_user_id ON public.rank_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_requests_club_id ON public.rank_requests(club_id);
CREATE INDEX IF NOT EXISTS idx_rank_requests_status ON public.rank_requests(status);
CREATE INDEX IF NOT EXISTS idx_tournament_automation_log_tournament_id ON public.tournament_automation_log(tournament_id);
CREATE INDEX IF NOT EXISTS idx_user_chat_sessions_user_id ON public.user_chat_sessions(user_id);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spa_points_log_updated_at BEFORE UPDATE ON public.spa_points_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rank_verifications_updated_at BEFORE UPDATE ON public.rank_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rank_requests_updated_at BEFORE UPDATE ON public.rank_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_schedules_updated_at BEFORE UPDATE ON public.test_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rank_test_results_updated_at BEFORE UPDATE ON public.rank_test_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_chat_sessions_updated_at BEFORE UPDATE ON public.user_chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA POPULATION
-- =====================================================

-- Create default wallets for existing users
INSERT INTO public.wallets (user_id, points_balance, total_earned, created_at, updated_at)
SELECT 
  p.user_id,
  COALESCE(pr.spa_points, 0) as points_balance,
  COALESCE(pr.spa_points, 0) as total_earned,
  now(),
  now()
FROM public.profiles p
LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id
WHERE NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.user_id = p.user_id)
AND p.is_demo_user = false;

-- =====================================================
-- VALIDATION AND CONSTRAINTS
-- =====================================================

-- Add check constraints for data validation
ALTER TABLE public.wallets ADD CONSTRAINT wallets_balance_non_negative CHECK (points_balance >= 0);
ALTER TABLE public.spa_points_log ADD CONSTRAINT spa_points_log_values_valid CHECK (points_earned >= 0 AND points_spent >= 0);
ALTER TABLE public.spa_reward_milestones ADD CONSTRAINT milestones_requirement_positive CHECK (requirement_value > 0);
ALTER TABLE public.spa_reward_milestones ADD CONSTRAINT milestones_reward_positive CHECK (spa_reward > 0);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Log completion
INSERT INTO public.tournament_automation_log (
  tournament_id, automation_type, status, details, completed_at
) VALUES (
  gen_random_uuid(), 'database_migration', 'completed',
  '{"tables_created": ["ranks", "wallets", "spa_points_log", "spa_reward_milestones", "rank_verifications", "rank_requests", "test_schedules", "rank_test_results", "tournament_automation_log", "user_chat_sessions"], "policies_created": 30, "indexes_created": 10}',
  now()
);