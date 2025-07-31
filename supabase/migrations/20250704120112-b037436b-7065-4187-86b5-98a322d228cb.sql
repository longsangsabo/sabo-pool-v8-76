-- Create only missing database tables

-- 1. Wallet system for payments and points
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  points_balance INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'frozen')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Wallet transactions for tracking all money/points movements
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'payment', 'refund', 'reward', 'penalty')),
  amount DECIMAL(10,2) NOT NULL,
  points_amount INTEGER DEFAULT 0,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID, -- Links to matches, tournaments, etc.
  payment_method TEXT, -- 'vnpay', 'momo', 'cash', 'bank_transfer'
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tournament brackets and results
CREATE TABLE public.tournament_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  bracket_data JSONB NOT NULL, -- Store bracket structure
  current_round INTEGER DEFAULT 1,
  total_rounds INTEGER NOT NULL,
  bracket_type TEXT DEFAULT 'single_elimination' CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Club booking system
CREATE TABLE public.table_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours DECIMAL(3,1) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  notes TEXT,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Live streaming sessions
CREATE TABLE public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stream_key TEXT NOT NULL UNIQUE,
  stream_url TEXT,
  viewer_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'offline' CHECK (status IN ('offline', 'live', 'ended')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  match_id UUID REFERENCES public.matches(id),
  tournament_id UUID REFERENCES public.tournaments(id),
  club_id UUID REFERENCES public.clubs(id),
  is_featured BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Wallets
CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Wallet Transactions
CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.wallets WHERE id = wallet_transactions.wallet_id));

CREATE POLICY "System can create transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for Tournament Brackets
CREATE POLICY "Everyone can view tournament brackets" ON public.tournament_brackets
  FOR SELECT USING (true);

CREATE POLICY "Tournament organizers can manage brackets" ON public.tournament_brackets
  FOR ALL USING (auth.uid() IN (
    SELECT cp.user_id FROM public.club_profiles cp
    JOIN public.tournaments t ON t.club_id = cp.id
    WHERE t.id = tournament_brackets.tournament_id
  ));

-- RLS Policies for Table Bookings
CREATE POLICY "Users can view their own bookings" ON public.table_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.table_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Club owners can view all bookings for their clubs" ON public.table_bookings
  FOR SELECT USING (auth.uid() IN (
    SELECT cp.user_id FROM public.club_profiles cp
    WHERE cp.id = table_bookings.club_id
  ));

-- RLS Policies for Live Streams
CREATE POLICY "Everyone can view live streams" ON public.live_streams
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own streams" ON public.live_streams
  FOR ALL USING (auth.uid() = streamer_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_brackets_updated_at
  BEFORE UPDATE ON public.tournament_brackets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_table_bookings_updated_at
  BEFORE UPDATE ON public.table_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_live_streams_updated_at
  BEFORE UPDATE ON public.live_streams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);
CREATE INDEX idx_tournament_brackets_tournament_id ON public.tournament_brackets(tournament_id);
CREATE INDEX idx_table_bookings_club_id_date ON public.table_bookings(club_id, booking_date);
CREATE INDEX idx_table_bookings_user_id ON public.table_bookings(user_id);
CREATE INDEX idx_live_streams_status ON public.live_streams(status);
CREATE INDEX idx_live_streams_streamer_id ON public.live_streams(streamer_id);

-- Auto-create wallet for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_wallet();