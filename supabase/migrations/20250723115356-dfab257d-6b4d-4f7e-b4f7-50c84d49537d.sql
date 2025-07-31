-- =====================================================
-- FIX MISSING TABLES - PHASE 2: RANK VERIFICATION SYSTEM
-- =====================================================

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

-- Create tournament_automation_log table
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
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE public.rank_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_automation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Rank requests policies
CREATE POLICY "Users can view their own rank requests" ON public.rank_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Club owners can view requests for their club" ON public.rank_requests FOR SELECT USING (
  club_id IN (SELECT id FROM club_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create rank requests" ON public.rank_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Club owners can update requests for their club" ON public.rank_requests FOR UPDATE USING (
  club_id IN (SELECT id FROM club_profiles WHERE user_id = auth.uid())
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

-- Add foreign key constraints where possible
ALTER TABLE public.rank_requests 
ADD CONSTRAINT fk_rank_requests_club_id 
FOREIGN KEY (club_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.rank_verifications 
ADD CONSTRAINT fk_rank_verifications_club_id 
FOREIGN KEY (club_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.test_schedules 
ADD CONSTRAINT fk_test_schedules_club_id 
FOREIGN KEY (club_id) REFERENCES public.club_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.rank_test_results 
ADD CONSTRAINT fk_rank_test_results_schedule_id 
FOREIGN KEY (test_schedule_id) REFERENCES public.test_schedules(id) ON DELETE CASCADE;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rank_requests_user_id ON public.rank_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_requests_club_id ON public.rank_requests(club_id);
CREATE INDEX IF NOT EXISTS idx_rank_requests_status ON public.rank_requests(status);
CREATE INDEX IF NOT EXISTS idx_rank_verifications_user_id ON public.rank_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_verifications_club_id ON public.rank_verifications(club_id);
CREATE INDEX IF NOT EXISTS idx_rank_verifications_status ON public.rank_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_tournament_automation_log_tournament_id ON public.tournament_automation_log(tournament_id);
CREATE INDEX IF NOT EXISTS idx_user_chat_sessions_user_id ON public.user_chat_sessions(user_id);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Create triggers for updated_at
CREATE TRIGGER update_rank_requests_updated_at BEFORE UPDATE ON public.rank_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rank_verifications_updated_at BEFORE UPDATE ON public.rank_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_schedules_updated_at BEFORE UPDATE ON public.test_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rank_test_results_updated_at BEFORE UPDATE ON public.rank_test_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_chat_sessions_updated_at BEFORE UPDATE ON public.user_chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();