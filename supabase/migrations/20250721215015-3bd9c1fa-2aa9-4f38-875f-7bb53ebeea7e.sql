
-- Create matches table (main table for match history)
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    winner_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    match_type TEXT DEFAULT 'challenge' CHECK (match_type IN ('challenge', 'tournament', 'practice', 'ranked')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    game_format TEXT DEFAULT '8_ball' CHECK (game_format IN ('8_ball', '9_ball', '10_ball', 'straight_pool')),
    bet_points INTEGER DEFAULT 0,
    frames INTEGER DEFAULT 1,
    club_id UUID REFERENCES club_profiles(id) ON DELETE SET NULL,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    match_date DATE DEFAULT CURRENT_DATE,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'disputed')),
    verified_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create elo_history table
CREATE TABLE public.elo_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    old_elo INTEGER NOT NULL,
    new_elo INTEGER NOT NULL,
    elo_change INTEGER NOT NULL,
    opponent_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    opponent_elo INTEGER,
    match_result TEXT CHECK (match_result IN ('win', 'loss', 'draw')),
    match_type TEXT DEFAULT 'challenge',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE UNIQUE,
    in_app BOOLEAN DEFAULT true,
    email BOOLEAN DEFAULT true,
    sms BOOLEAN DEFAULT false,
    zalo BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    tournament_notifications BOOLEAN DEFAULT true,
    challenge_notifications BOOLEAN DEFAULT true,
    ranking_notifications BOOLEAN DEFAULT true,
    club_notifications BOOLEAN DEFAULT true,
    match_reminders BOOLEAN DEFAULT true,
    payment_notifications BOOLEAN DEFAULT true,
    system_maintenance BOOLEAN DEFAULT true,
    new_features BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_actions table
CREATE TABLE public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create practice_sessions table
CREATE TABLE public.practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    player2_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    club_id UUID REFERENCES club_profiles(id) ON DELETE SET NULL,
    location TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 60,
    notes TEXT,
    is_group_session BOOLEAN DEFAULT false,
    max_participants INTEGER DEFAULT 2,
    current_participants INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'entry_fee', 'prize', 'refund', 'tournament_prize')),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    reference_id UUID,
    reference_type TEXT,
    payment_method TEXT,
    external_transaction_id TEXT,
    fees DECIMAL(10,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0,
    points_balance INTEGER DEFAULT 0,
    total_earned DECIMAL(10,2) DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_demo_user BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Update spa_transactions table
ALTER TABLE public.spa_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'manual';
ALTER TABLE public.spa_transactions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'admin';
ALTER TABLE public.spa_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE public.spa_transactions ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL;
ALTER TABLE public.spa_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_players ON matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_elo_history_user ON elo_history(user_id);
CREATE INDEX IF NOT EXISTS idx_elo_history_match ON elo_history(match_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_player1 ON practice_sessions(player1_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_player2 ON practice_sessions(player2_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Enable RLS on all new tables
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elo_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- RLS policies for matches
CREATE POLICY "Users can view matches they participate in" 
ON public.matches FOR SELECT 
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can insert matches they participate in" 
ON public.matches FOR INSERT 
WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can update matches they participate in" 
ON public.matches FOR UPDATE 
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- RLS policies for elo_history
CREATE POLICY "Users can view their own ELO history" 
ON public.elo_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert ELO history" 
ON public.elo_history FOR INSERT 
WITH CHECK (true);

-- RLS policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON public.notification_preferences FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for admin_actions
CREATE POLICY "Admins can view all admin actions" 
ON public.admin_actions FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can insert admin actions" 
ON public.admin_actions FOR INSERT 
WITH CHECK (auth.uid() = admin_id AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- RLS policies for practice_sessions
CREATE POLICY "Users can view practice sessions they participate in" 
ON public.practice_sessions FOR SELECT 
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can manage practice sessions they created" 
ON public.practice_sessions FOR ALL 
USING (auth.uid() = player1_id)
WITH CHECK (auth.uid() = player1_id);

-- RLS policies for wallet_transactions
CREATE POLICY "Users can view their own wallet transactions" 
ON public.wallet_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet transactions" 
ON public.wallet_transactions FOR INSERT 
WITH CHECK (true);

-- RLS policies for wallets
CREATE POLICY "Users can view their own wallet" 
ON public.wallets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" 
ON public.wallets FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallets" 
ON public.wallets FOR INSERT 
WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_practice_sessions_updated_at 
    BEFORE UPDATE ON practice_sessions 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_wallet_transactions_updated_at 
    BEFORE UPDATE ON wallet_transactions 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON wallets 
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
