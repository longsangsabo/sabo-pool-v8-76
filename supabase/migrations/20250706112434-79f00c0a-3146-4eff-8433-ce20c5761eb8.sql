-- Give existing valid users their signup bonus and referral codes
DO $$
DECLARE
  user_record RECORD;
  v_referral_code TEXT;
  v_wallet_id UUID;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
  v_count INTEGER := 0;
BEGIN
  -- Loop through all existing users who don't have referral codes yet
  -- AND exist in auth.users table
  FOR user_record IN 
    SELECT p.user_id, p.full_name 
    FROM public.profiles p
    WHERE p.my_referral_code IS NULL
    AND EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = p.user_id
    )
  LOOP
    -- Generate referral code for existing users
    v_referral_code := public.generate_referral_code(user_record.user_id);
    
    -- Update profile with referral code
    UPDATE public.profiles 
    SET my_referral_code = v_referral_code
    WHERE user_id = user_record.user_id;
    
    -- Get current balance before update
    SELECT COALESCE(balance, 0) INTO v_balance_before
    FROM public.wallets 
    WHERE user_id = user_record.user_id;
    
    -- If no balance found, set to 0 (new wallet)
    IF v_balance_before IS NULL THEN
      v_balance_before := 0;
    END IF;
    
    -- Calculate balance after adding 100 SPA
    v_balance_after := v_balance_before + 100;
    
    -- Create or update wallet with 100 SPA signup bonus
    INSERT INTO public.wallets (user_id, balance)
    VALUES (user_record.user_id, 100)
    ON CONFLICT (user_id) 
    DO UPDATE SET balance = public.wallets.balance + 100;
    
    -- Get wallet ID for transaction log
    SELECT id INTO v_wallet_id
    FROM public.wallets 
    WHERE user_id = user_record.user_id;
    
    -- Log the signup bonus transaction with proper balance tracking
    INSERT INTO public.wallet_transactions (
      wallet_id, 
      amount, 
      transaction_type,
      transaction_category,
      description,
      balance_before,
      balance_after
    ) VALUES (
      v_wallet_id,
      100, 
      'credit',
      'signup_bonus',
      'Thưởng đăng ký tài khoản (cập nhật hệ thống)',
      v_balance_before,
      v_balance_after
    );
    
    v_count := v_count + 1;
    RAISE NOTICE 'Updated user: % with referral code: % and 100 SPA (% -> %)', 
      COALESCE(user_record.full_name, 'Unknown'), v_referral_code, v_balance_before, v_balance_after;
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully! Updated % users.', v_count;
END $$;