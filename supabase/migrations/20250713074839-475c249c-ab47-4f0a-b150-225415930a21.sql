-- Fix transaction_type in simple_grant_spa_points_debug function
CREATE OR REPLACE FUNCTION public.simple_grant_spa_points_debug(
  target_user_id UUID,
  spa_amount INTEGER,
  granting_admin_id UUID,
  grant_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_admin_valid BOOLEAN := FALSE;
  v_user_exists BOOLEAN := FALSE;
  v_current_spa INTEGER := 0;
  v_new_spa INTEGER := 0;
  v_transaction_id UUID;
BEGIN
  RAISE NOTICE 'Starting simple_grant_spa_points_debug with target_user_id: %, spa_amount: %', target_user_id, spa_amount;

  -- Basic validations
  IF spa_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Check admin status
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = granting_admin_id AND is_admin = true
  ) INTO v_admin_valid;
  
  RAISE NOTICE 'Admin validation result: %', v_admin_valid;
  
  IF NOT v_admin_valid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Check user exists
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE user_id = target_user_id
  ) INTO v_user_exists;
  
  RAISE NOTICE 'User exists check: %', v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Get current SPA from player_rankings
  SELECT COALESCE(spa_points, 0) INTO v_current_spa
  FROM public.player_rankings 
  WHERE user_id = target_user_id;
  
  RAISE NOTICE 'Current SPA found: %', v_current_spa;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    RAISE NOTICE 'No player_rankings record found, creating one';
    INSERT INTO public.player_rankings (user_id, spa_points, elo_points, total_matches, wins)
    VALUES (target_user_id, 0, 1000, 0, 0);
    v_current_spa := 0;
  END IF;

  -- Calculate new amount
  v_new_spa := v_current_spa + spa_amount;
  RAISE NOTICE 'Updating SPA from % to %', v_current_spa, v_new_spa;

  -- Update SPA points directly
  UPDATE public.player_rankings 
  SET spa_points = v_new_spa,
      updated_at = NOW()
  WHERE user_id = target_user_id;

  RAISE NOTICE 'SPA points updated successfully';

  -- *** FIXED: Use 'admin_adjustment' instead of 'admin_grant' ***
  INSERT INTO public.spa_transactions (
    user_id, 
    amount, 
    transaction_type, 
    category, 
    description, 
    admin_id, 
    status,
    created_at
  ) VALUES (
    target_user_id, 
    spa_amount, 
    'admin_adjustment',  -- FIXED: Changed from 'admin_grant' to 'admin_adjustment'
    'admin', 
    grant_reason, 
    granting_admin_id, 
    'completed',
    NOW()
  ) RETURNING id INTO v_transaction_id;

  RAISE NOTICE 'Transaction logged with ID: %', v_transaction_id;

  -- Sync với wallets table
  INSERT INTO public.wallets (user_id, points_balance, balance, status)
  VALUES (target_user_id, v_new_spa, 0, 'active')
  ON CONFLICT (user_id) DO UPDATE SET
    points_balance = v_new_spa,
    updated_at = NOW();

  RAISE NOTICE 'Wallet synced successfully';

  -- Create notification for user
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  VALUES (
    target_user_id,
    'spa_credited',
    'Nhận SPA Points từ Admin',
    format('Bạn đã nhận %s SPA Points từ admin: %s', spa_amount, grant_reason),
    'normal'
  );

  RAISE NOTICE 'Notification created successfully';

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'old_balance', v_current_spa,
    'new_balance', v_new_spa,
    'amount_granted', spa_amount,
    'reason', grant_reason
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error occurred: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;