-- Clean up orphaned profiles and fix SPA points foundation
-- First, remove profiles that don't have corresponding auth users
DELETE FROM profiles 
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = profiles.user_id
);

-- Now proceed with wallet foundation setup
-- Add missing columns to wallets table
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS total_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0;

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- Create wallets for users who don't have them (only for valid users)
INSERT INTO public.wallets (user_id, balance, points_balance, total_earned, total_spent)
SELECT p.user_id, 0, 0, 0, 0
FROM public.profiles p
WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id)
AND NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.user_id = p.user_id)
ON CONFLICT (user_id) DO NOTHING;

-- Update existing wallets with calculated totals from transactions
UPDATE public.wallets 
SET 
  total_earned = COALESCE((
    SELECT SUM(points_amount) 
    FROM public.wallet_transactions wt 
    WHERE wt.wallet_id = wallets.id 
    AND wt.points_amount > 0
  ), 0),
  total_spent = COALESCE((
    SELECT ABS(SUM(points_amount)) 
    FROM public.wallet_transactions wt 
    WHERE wt.wallet_id = wallets.id 
    AND wt.points_amount < 0
  ), 0);

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

-- Create function to safely debit SPA points
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