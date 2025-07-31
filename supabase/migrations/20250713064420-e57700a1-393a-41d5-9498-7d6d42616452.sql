-- Recreate admin_credit_spa_points function completely to avoid any legacy issues
DROP FUNCTION IF EXISTS public.admin_credit_spa_points(uuid, integer, text, uuid);

CREATE OR REPLACE FUNCTION public.admin_credit_spa_points(
  p_user_id uuid, 
  p_amount integer, 
  p_reason text, 
  p_admin_id uuid
) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_spa INTEGER := 0;
  v_new_spa INTEGER := 0;
  v_admin_check BOOLEAN := false;
  v_transaction_id UUID;
  v_current_wallet_balance INTEGER := 0;
  v_new_wallet_balance INTEGER := 0;
  v_user_exists BOOLEAN := false;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Check if the calling user is an admin
  SELECT COALESCE(is_admin, false) INTO v_admin_check
  FROM public.profiles
  WHERE user_id = p_admin_id;
  
  IF NOT v_admin_check THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only admins can credit SPA points'
    );
  END IF;
  
  -- Validate amount (must be positive for credits)
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Amount must be positive for credits'
    );
  END IF;
  
  -- Get current SPA points from player_rankings
  SELECT COALESCE(spa_points, 0) INTO v_current_spa
  FROM public.player_rankings
  WHERE user_id = p_user_id;
  
  -- If player ranking doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO public.player_rankings (
      user_id, spa_points, elo_points, total_matches, wins, losses, updated_at
    ) VALUES (
      p_user_id, 0, 1000, 0, 0, 0, NOW()
    );
    v_current_spa := 0;
  END IF;
  
  -- Get current wallet balance
  SELECT COALESCE(points_balance, 0) INTO v_current_wallet_balance
  FROM public.wallets
  WHERE user_id = p_user_id;
  
  -- If wallet doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, points_balance, balance, status, updated_at)
    VALUES (p_user_id, 0, 0, 'active', NOW());
    v_current_wallet_balance := 0;
  END IF;
  
  -- Calculate new amounts
  v_new_spa := v_current_spa + p_amount;
  v_new_wallet_balance := v_current_wallet_balance + p_amount;
  
  -- Update SPA points in player_rankings
  UPDATE public.player_rankings
  SET spa_points = v_new_spa,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Update wallet balance
  UPDATE public.wallets
  SET points_balance = v_new_wallet_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction in spa_transactions table
  INSERT INTO public.spa_transactions (
    user_id,
    amount,
    transaction_type,
    category,
    description,
    status,
    admin_id,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    'admin_credit',
    'admin',
    p_reason,
    'completed',
    p_admin_id,
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'user_id', p_user_id,
    'old_spa_amount', v_current_spa,
    'new_spa_amount', v_new_spa,
    'old_wallet_balance', v_current_wallet_balance,
    'new_wallet_balance', v_new_wallet_balance,
    'amount_added', p_amount,
    'reason', p_reason,
    'admin_id', p_admin_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in admin_credit_spa_points: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;