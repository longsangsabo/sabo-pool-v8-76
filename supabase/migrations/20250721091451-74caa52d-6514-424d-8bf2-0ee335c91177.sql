-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_role TEXT DEFAULT 'player' CHECK (active_role IN ('player', 'club_owner'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player' CHECK (role IN ('player', 'club_owner', 'both'));

-- Add missing columns to player_rankings table
ALTER TABLE public.player_rankings ADD COLUMN IF NOT EXISTS verified_rank TEXT;

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  points_balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Create policies for wallets
CREATE POLICY "Users can view their own wallet" 
ON public.wallets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" 
ON public.wallets FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" 
ON public.wallets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create tournament_registrations table
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  payment_status TEXT DEFAULT 'pending',
  payment_priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS on tournament_registrations
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for tournament_registrations
CREATE POLICY "Users can view tournament registrations" 
ON public.tournament_registrations FOR SELECT 
USING (true);

CREATE POLICY "Users can register for tournaments" 
ON public.tournament_registrations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations" 
ON public.tournament_registrations FOR UPDATE 
USING (auth.uid() = user_id);

-- Create missing functions
CREATE OR REPLACE FUNCTION public.calculate_tournament_spa(
  p_player_rank TEXT,
  p_tournament_type TEXT DEFAULT 'standard',
  p_position INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_spa INTEGER;
  v_multiplier NUMERIC;
BEGIN
  -- Base SPA calculation based on position
  CASE p_position
    WHEN 1 THEN v_base_spa := 100;
    WHEN 2 THEN v_base_spa := 80;
    WHEN 3 THEN v_base_spa := 60;
    WHEN 4 THEN v_base_spa := 40;
    WHEN 8 THEN v_base_spa := 20;
    WHEN 16 THEN v_base_spa := 10;
    ELSE v_base_spa := 5;
  END CASE;
  
  -- Tournament type multiplier
  CASE p_tournament_type
    WHEN 'major' THEN v_multiplier := 2.0;
    WHEN 'premium' THEN v_multiplier := 1.5;
    ELSE v_multiplier := 1.0;
  END CASE;
  
  RETURN ROUND(v_base_spa * v_multiplier);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_tournament_registration_priority(
  p_tournament_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_priority INTEGER;
BEGIN
  SELECT payment_priority INTO v_priority
  FROM tournament_registrations
  WHERE tournament_id = p_tournament_id AND user_id = p_user_id;
  
  RETURN COALESCE(v_priority, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.club_confirm_payment(
  p_tournament_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tournament_registrations
  SET payment_status = 'confirmed',
      payment_priority = payment_priority + 1,
      updated_at = NOW()
  WHERE tournament_id = p_tournament_id AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Create trigger for wallets updated_at
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for tournament_registrations updated_at
CREATE TRIGGER update_tournament_registrations_updated_at
  BEFORE UPDATE ON public.tournament_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to create wallet when profile is created
CREATE OR REPLACE FUNCTION public.create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, points_balance, total_earned, total_spent)
  VALUES (NEW.user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_wallet_on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_wallet();