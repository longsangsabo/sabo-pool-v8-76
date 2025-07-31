-- Drop and recreate the function with correct parameter naming
DROP FUNCTION IF EXISTS public.generate_referral_code(uuid);

CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID)
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
          (SELECT full_name FROM public.profiles WHERE user_id = p_user_id), 
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

-- Update the trigger function to use the new parameter name
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

-- Now run the migration to give existing users their signup bonus
DO $$
DECLARE
  user_record RECORD;
  v_referral_code TEXT;
  v_wallet_id UUID;
BEGIN
  -- Loop through all existing users who don't have referral codes yet
  FOR user_record IN 
    SELECT user_id, full_name 
    FROM public.profiles 
    WHERE my_referral_code IS NULL
  LOOP
    -- Generate referral code for existing users
    v_referral_code := public.generate_referral_code(user_record.user_id);
    
    -- Update profile with referral code
    UPDATE public.profiles 
    SET my_referral_code = v_referral_code
    WHERE user_id = user_record.user_id;
    
    -- Create or update wallet with 100 SPA signup bonus
    INSERT INTO public.wallets (user_id, balance)
    VALUES (user_record.user_id, 100)
    ON CONFLICT (user_id) 
    DO UPDATE SET balance = public.wallets.balance + 100;
    
    -- Get wallet ID for transaction log
    SELECT id INTO v_wallet_id
    FROM public.wallets 
    WHERE user_id = user_record.user_id;
    
    -- Log the signup bonus transaction
    INSERT INTO public.wallet_transactions (
      wallet_id, 
      amount, 
      transaction_type,
      transaction_category,
      description
    ) VALUES (
      v_wallet_id,
      100, 
      'credit',
      'signup_bonus',
      'Thưởng đăng ký tài khoản (cập nhật hệ thống)'
    );
    
    RAISE NOTICE 'Updated user: % with referral code: % and 100 SPA', 
      COALESCE(user_record.full_name, 'Unknown'), v_referral_code;
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully!';
END $$;