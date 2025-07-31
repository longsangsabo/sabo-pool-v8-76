-- Update trigger function to use correct transaction_type
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
  
  -- Log transaction with proper balance tracking
  INSERT INTO public.wallet_transactions (
    wallet_id, 
    amount, 
    transaction_type,
    transaction_category,
    description,
    balance_before,
    balance_after
  )
  SELECT 
    w.id, 
    100, 
    'reward',  -- Use 'reward' instead of 'credit'
    'signup_bonus',
    'Thưởng đăng ký tài khoản mới',
    COALESCE(w.balance - 100, 0),  -- Balance before adding 100
    w.balance  -- Current balance after adding 100
  FROM public.wallets w
  WHERE w.user_id = NEW.user_id;
  
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

-- Also update the referral completion trigger to use 'reward'
CREATE OR REPLACE FUNCTION public.complete_referral_bonus()
RETURNS TRIGGER AS $$
DECLARE
  v_referral RECORD;
  v_referrer_wallet_id UUID;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
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
      
      -- Get referrer wallet and current balance
      SELECT id, balance INTO v_referrer_wallet_id, v_balance_before
      FROM public.wallets
      WHERE user_id = v_referral.referrer_id;
      
      v_balance_after := v_balance_before + 100;
      
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
        description,
        balance_before,
        balance_after
      ) VALUES (
        v_referrer_wallet_id,
        100,
        'reward',  -- Use 'reward' instead of 'credit'
        'referral_bonus',
        'Thưởng giới thiệu bạn mới',
        v_balance_before,
        v_balance_after
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