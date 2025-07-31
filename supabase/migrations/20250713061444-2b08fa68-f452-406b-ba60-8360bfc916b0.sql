-- Fix admin_credit_spa_points function to use user_id instead of player_id
CREATE OR REPLACE FUNCTION public.admin_credit_spa_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_spa INTEGER;
  v_new_spa INTEGER;
  v_admin_check BOOLEAN;
  v_transaction_id UUID;
  v_current_wallet_balance INTEGER;
  v_new_wallet_balance INTEGER;
BEGIN
  -- Check if the calling user is an admin
  SELECT is_admin INTO v_admin_check
  FROM public.profiles
  WHERE user_id = p_admin_id;
  
  IF NOT COALESCE(v_admin_check, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can credit SPA points';
  END IF;
  
  -- Validate amount (must be positive for credits)
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive for credits';
  END IF;
  
  -- Get current SPA points from player_rankings (FIXED: using user_id instead of player_id)
  SELECT COALESCE(spa_points, 0) INTO v_current_spa
  FROM public.player_rankings
  WHERE user_id = p_user_id;
  
  -- If player ranking doesn't exist, create it (FIXED: using user_id instead of player_id)
  IF v_current_spa IS NULL THEN
    INSERT INTO public.player_rankings (user_id, spa_points, total_matches, wins, losses)
    VALUES (p_user_id, 0, 0, 0, 0);
    v_current_spa := 0;
  END IF;
  
  -- Get current wallet balance
  SELECT COALESCE(points_balance, 0) INTO v_current_wallet_balance
  FROM public.wallets
  WHERE user_id = p_user_id;
  
  -- If wallet doesn't exist, create it
  IF v_current_wallet_balance IS NULL THEN
    INSERT INTO public.wallets (user_id, points_balance, balance, status)
    VALUES (p_user_id, 0, 0, 'active');
    v_current_wallet_balance := 0;
  END IF;
  
  -- Calculate new amounts
  v_new_spa := v_current_spa + p_amount;
  v_new_wallet_balance := v_current_wallet_balance + p_amount;
  
  -- Update SPA points in player_rankings (FIXED: using user_id instead of player_id)
  UPDATE public.player_rankings
  SET spa_points = v_new_spa,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Update wallet balance
  UPDATE public.wallets
  SET points_balance = v_new_wallet_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction in spa_transactions table with admin_id
  INSERT INTO public.spa_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    reference_id,
    status,
    admin_id
  ) VALUES (
    p_user_id,
    p_amount,
    'admin_credit',
    p_reason,
    'admin_' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'completed',
    p_admin_id
  ) RETURNING id INTO v_transaction_id;
  
  -- Return result
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
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;