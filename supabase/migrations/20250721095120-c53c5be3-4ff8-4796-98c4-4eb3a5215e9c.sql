
-- ============================================
-- COMPREHENSIVE DATABASE CREATION PLAN
-- Creating all missing tables, functions, and fixes
-- ============================================

-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- Add missing columns to challenges table
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
ADD COLUMN IF NOT EXISTS bet_points INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id),
ADD COLUMN IF NOT EXISTS club_confirmed BOOLEAN DEFAULT false;

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ban_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS opening_time TIME,
ADD COLUMN IF NOT EXISTS closing_time TIME,
ADD COLUMN IF NOT EXISTS table_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_demo_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add missing columns to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE;

-- Add missing columns to tournament_registrations table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add missing columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS auto_popup BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. CREATE TOURNAMENT SYSTEM TABLES
-- Tournament matches table
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES auth.users(id),
  player2_id UUID REFERENCES auth.users(id),
  winner_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_time TIMESTAMP WITH TIME ZONE,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  score_player1 INTEGER,
  score_player2 INTEGER,
  is_third_place_match BOOLEAN DEFAULT false,
  assigned_table_id UUID,
  assigned_table_number INTEGER,
  table_assigned_at TIMESTAMP WITH TIME ZONE,
  score_input_by UUID REFERENCES auth.users(id),
  score_confirmed_by UUID REFERENCES auth.users(id),
  score_status TEXT DEFAULT 'pending',
  score_submitted_at TIMESTAMP WITH TIME ZONE,
  score_confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament brackets table
CREATE TABLE IF NOT EXISTS public.tournament_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  bracket_data JSONB NOT NULL DEFAULT '{}',
  bracket_type TEXT NOT NULL DEFAULT 'single_elimination',
  total_rounds INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match events table
CREATE TABLE IF NOT EXISTS public.match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.tournament_matches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Club tables table
CREATE TABLE IF NOT EXISTS public.club_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  table_name TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  current_match_id UUID REFERENCES public.tournament_matches(id),
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, table_number)
);

-- 3. CREATE WALLET & PAYMENT TABLES
-- Wallet transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SPA transactions table (enhanced)
CREATE TABLE IF NOT EXISTS public.spa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE ADMIN & MANAGEMENT TABLES
-- Admin actions table
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  action_data JSONB DEFAULT '{}',
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation performance log table
CREATE TABLE IF NOT EXISTS public.automation_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin management table
CREATE TABLE IF NOT EXISTS public.admin_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  permissions JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Club registrations table
CREATE TABLE IF NOT EXISTS public.club_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  club_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT,
  opening_time TIME,
  closing_time TIME,
  table_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE RANK VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.rank_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  requested_rank TEXT NOT NULL,
  current_rank TEXT,
  evidence_url TEXT,
  club_id UUID REFERENCES public.clubs(id),
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CREATE MUTUAL RATINGS TABLE (for trust score)
CREATE TABLE IF NOT EXISTS public.mutual_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID NOT NULL REFERENCES auth.users(id),
  rated_entity_id UUID NOT NULL,
  rated_entity_type TEXT NOT NULL, -- 'user' or 'club'
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rater_id, rated_entity_id, rated_entity_type)
);

-- 7. ADD TRUST SCORE COLUMNS
ALTER TABLE public.player_rankings 
ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS club_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tournament_wins INTEGER DEFAULT 0;

ALTER TABLE public.club_profiles 
ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 8. CREATE MATCH AUTOMATION LOG TABLE
CREATE TABLE IF NOT EXISTS public.match_automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.tournament_matches(id),
  automation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_performance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutual_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_automation_log ENABLE ROW LEVEL SECURITY;

-- 10. CREATE RLS POLICIES
-- Tournament matches policies
CREATE POLICY "Users can view tournament matches" 
ON public.tournament_matches FOR SELECT 
USING (true);

CREATE POLICY "Players can update their own matches" 
ON public.tournament_matches FOR UPDATE 
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Club tables policies
CREATE POLICY "Club owners can manage their tables" 
ON public.club_tables FOR ALL 
USING (
  club_id IN (
    SELECT id FROM public.clubs WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view club tables" 
ON public.club_tables FOR SELECT 
USING (true);

-- Wallet transactions policies
CREATE POLICY "Users can view their own wallet transactions" 
ON public.wallet_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- SPA transactions policies
CREATE POLICY "Users can view their own SPA transactions" 
ON public.spa_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Admin actions policies
CREATE POLICY "Admins can view all admin actions" 
ON public.admin_actions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Club registrations policies
CREATE POLICY "Users can create club registrations" 
ON public.club_registrations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own club registrations" 
ON public.club_registrations FOR SELECT 
USING (auth.uid() = user_id);

-- Rank verifications policies
CREATE POLICY "Users can create rank verifications" 
ON public.rank_verifications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own rank verifications" 
ON public.rank_verifications FOR SELECT 
USING (auth.uid() = user_id);

-- Mutual ratings policies
CREATE POLICY "Users can rate others" 
ON public.mutual_ratings FOR INSERT 
WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Users can view all ratings" 
ON public.mutual_ratings FOR SELECT 
USING (true);

-- 11. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_player1_id ON public.tournament_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_player2_id ON public.tournament_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON public.tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_club_tables_club_id ON public.club_tables(club_id);
CREATE INDEX IF NOT EXISTS idx_club_tables_status ON public.club_tables(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_spa_transactions_user_id ON public.spa_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_mutual_ratings_rated_entity ON public.mutual_ratings(rated_entity_id, rated_entity_type);

-- 12. CREATE TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournament_matches_updated_at
  BEFORE UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_club_tables_updated_at
  BEFORE UPDATE ON public.club_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_wallet_transactions_updated_at
  BEFORE UPDATE ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_spa_transactions_updated_at
  BEFORE UPDATE ON public.spa_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 13. CREATE CONSTRAINTS
ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_status_check 
CHECK (status IN ('scheduled', 'ready', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE public.club_tables 
ADD CONSTRAINT club_tables_status_check 
CHECK (status IN ('available', 'occupied', 'maintenance'));

ALTER TABLE public.wallet_transactions 
ADD CONSTRAINT wallet_transactions_status_check 
CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));

ALTER TABLE public.spa_transactions 
ADD CONSTRAINT spa_transactions_status_check 
CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));

ALTER TABLE public.club_registrations 
ADD CONSTRAINT club_registrations_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.rank_verifications 
ADD CONSTRAINT rank_verifications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.match_automation_log 
ADD CONSTRAINT match_automation_log_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped'));

ALTER TABLE public.match_automation_log 
ADD CONSTRAINT match_automation_log_automation_type_check 
CHECK (automation_type IN ('elo_calculation', 'spa_award', 'rank_update', 'milestone_check', 'score_update', 'match_completion', 'tournament_progression', 'table_release', 'auto_advance'));
