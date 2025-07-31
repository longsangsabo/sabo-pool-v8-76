-- STEP 1: Add referral tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.profiles(user_id) NOT NULL,
  referred_id UUID REFERENCES public.profiles(user_id) UNIQUE, -- Each user can only be referred once
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'expired')) DEFAULT 'pending',
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add referral code to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS my_referral_code VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS referral_bonus_claimed BOOLEAN DEFAULT FALSE;

-- Update wallet transactions table to add category if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_transactions' 
    AND column_name = 'transaction_category'
  ) THEN
    ALTER TABLE public.wallet_transactions
    ADD COLUMN transaction_category TEXT 
      CHECK (transaction_category IN ('deposit', 'withdrawal', 'match', 'referral_bonus', 'signup_bonus'));
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(my_referral_code);

-- STEP 2: Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code: First 3 letters of name + random 4 digits
    v_code := UPPER(
      COALESCE(
        SUBSTRING(
          (SELECT full_name FROM public.profiles WHERE user_id = user_id), 
          1, 3
        ),
        'USR'
      ) || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
    );
    
    -- Check if code exists
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE my_referral_code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger to auto-generate code and give signup bonus
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate referral code if not already set
  IF NEW.my_referral_code IS NULL THEN
    NEW.my_referral_code := public.generate_referral_code(NEW.user_id);
  END IF;
  
  -- Give 100 SPA signup bonus (create wallet if not exists)
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.user_id, 100)
  ON CONFLICT (user_id) 
  DO UPDATE SET balance = public.wallets.balance + 100;
  
  -- Log transaction
  INSERT INTO public.wallet_transactions (
    wallet_id, 
    amount, 
    transaction_type,
    transaction_category,
    description
  )
  SELECT 
    id, 
    100, 
    'credit',
    'signup_bonus',
    'Thưởng đăng ký tài khoản mới'
  FROM public.wallets 
  WHERE user_id = NEW.user_id;
  
  -- If referred by someone, create referral record
  IF NEW.referred_by_code IS NOT NULL THEN
    INSERT INTO public.referrals (
      referrer_id,
      referred_id,
      referral_code
    )
    SELECT 
      p.user_id,
      NEW.user_id,
      NEW.referred_by_code
    FROM public.profiles p
    WHERE p.my_referral_code = NEW.referred_by_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- STEP 3: Referral completion logic
CREATE OR REPLACE FUNCTION public.complete_referral_bonus()
RETURNS TRIGGER AS $$
DECLARE
  v_referral RECORD;
  v_referrer_wallet_id UUID;
BEGIN
  -- Check if this is first rank verification
  IF NEW.verified_at IS NOT NULL AND OLD.verified_at IS NULL THEN
    -- Find referral record
    SELECT * INTO v_referral
    FROM public.referrals
    WHERE referred_id = NEW.player_id
    AND status = 'pending';
    
    IF v_referral.id IS NOT NULL THEN
      -- Update referral status
      UPDATE public.referrals
      SET 
        status = 'completed',
        completed_at = NOW()
      WHERE id = v_referral.id;
      
      -- Get referrer wallet
      SELECT id INTO v_referrer_wallet_id
      FROM public.wallets
      WHERE user_id = v_referral.referrer_id;
      
      -- Give 100 SPA to referrer
      UPDATE public.wallets
      SET balance = balance + 100
      WHERE id = v_referrer_wallet_id;
      
      -- Log transaction
      INSERT INTO public.wallet_transactions (
        wallet_id,
        amount,
        transaction_type,
        transaction_category,
        description
      ) VALUES (
        v_referrer_wallet_id,
        100,
        'credit',
        'referral_bonus',
        'Thưởng giới thiệu bạn mới'
      );
      
      -- Notify referrer
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        priority
      ) VALUES (
        v_referral.referrer_id,
        'referral_completed',
        'Nhận thưởng giới thiệu!',
        'Bạn nhận được 100 SPA từ giới thiệu thành công',
        'high'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create triggers
DROP TRIGGER IF EXISTS on_user_signup_referral ON public.profiles;
CREATE TRIGGER on_user_signup_referral
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_referral();

DROP TRIGGER IF EXISTS on_rank_verification_complete_referral ON public.player_rankings;
CREATE TRIGGER on_rank_verification_complete_referral
  AFTER UPDATE ON public.player_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.complete_referral_bonus();

-- Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
CREATE POLICY "Users can view their own referrals" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "System can manage referrals" ON public.referrals;
CREATE POLICY "System can manage referrals" 
ON public.referrals 
FOR ALL 
USING (true);