-- Fix wallet structure and add missing functionality (corrected)
-- First, add the missing columns properly
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS total_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0;

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- Ensure we have a unique constraint on user_id (handle existing constraint)
DO $$ 
BEGIN
    ALTER TABLE public.wallets ADD CONSTRAINT wallets_user_id_unique UNIQUE (user_id);
EXCEPTION 
    WHEN duplicate_table THEN -- constraint already exists
        NULL;
END $$;

-- Create wallets for users who don't have them
INSERT INTO public.wallets (user_id, balance, points_balance, total_earned, total_spent)
SELECT p.user_id, 0, 0, 0, 0
FROM public.profiles p
LEFT JOIN public.wallets w ON p.user_id = w.user_id
WHERE w.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Create function to safely credit SPA points
CREATE OR REPLACE FUNCTION public.credit_spa_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_category TEXT,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_wallet_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Get or create wallet
  INSERT INTO public.wallets (user_id, balance, points_balance, total_earned, total_spent)
  VALUES (p_user_id, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get wallet info
  SELECT id, points_balance + p_amount 
  INTO v_wallet_id, v_new_balance
  FROM public.wallets
  WHERE user_id = p_user_id;
  
  -- Add points
  UPDATE public.wallets
  SET 
    points_balance = points_balance + p_amount,
    total_earned = total_earned + p_amount,
    updated_at = NOW()
  WHERE id = v_wallet_id;
  
  -- Log transaction
  INSERT INTO public.wallet_transactions (
    wallet_id, amount, points_amount, balance_after,
    transaction_type, transaction_category,
    description, reference_id
  ) VALUES (
    v_wallet_id, p_amount, p_amount, v_new_balance,
    'credit', p_category,
    p_description, p_reference_id
  );
  
  -- Also log in spa_points_log for compatibility
  INSERT INTO public.spa_points_log (
    player_id, source_type, source_id, points_earned, description
  ) VALUES (
    p_user_id, p_category, p_reference_id, p_amount, p_description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create function to safely debit SPA points (FIXED SYNTAX)
CREATE OR REPLACE FUNCTION public.debit_spa_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_category TEXT,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get wallet and lock row
  SELECT id, points_balance INTO v_wallet_id, v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if wallet exists
  IF v_wallet_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  v_new_balance := v_current_balance - p_amount;
  
  -- Deduct points
  UPDATE public.wallets
  SET 
    points_balance = points_balance - p_amount,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE id = v_wallet_id;
  
  -- Log transaction
  INSERT INTO public.wallet_transactions (
    wallet_id, amount, points_amount, balance_after,
    transaction_type, transaction_category,
    description, reference_id
  ) VALUES (
    v_wallet_id, -p_amount, -p_amount, v_new_balance,
    'debit', p_category,
    p_description, p_reference_id
  );
  
  -- Also log in spa_points_log for compatibility
  INSERT INTO public.spa_points_log (
    player_id, source_type, source_id, points_earned, description
  ) VALUES (
    p_user_id, p_category, p_reference_id, -p_amount, p_description
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger to ensure new users get wallets
CREATE OR REPLACE FUNCTION public.create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, points_balance, total_earned, total_spent)
  VALUES (NEW.user_id, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS ensure_user_wallet ON public.profiles;
CREATE TRIGGER ensure_user_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_wallet();