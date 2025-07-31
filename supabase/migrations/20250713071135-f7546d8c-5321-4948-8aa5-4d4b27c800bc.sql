-- Fix grant_spa_points function with correct column names
CREATE OR REPLACE FUNCTION public.grant_spa_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_admin_id UUID,
  p_reason TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_user_exists BOOLEAN;
  v_admin_exists BOOLEAN;
  v_current_spa INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Validate admin exists and is admin
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_admin_id AND is_admin = true
  ) INTO v_admin_exists;
  
  IF NOT v_admin_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Not admin');
  END IF;
  
  -- Validate user exists
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE user_id = p_user_id
  ) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;
  
  -- Get current SPA points
  SELECT COALESCE(spa_points, 0) INTO v_current_spa
  FROM public.player_rankings 
  WHERE user_id = p_user_id;
  
  -- If no current spa points, set to 0
  IF v_current_spa IS NULL THEN
    v_current_spa := 0;
  END IF;
  
  -- Insert transaction record
  INSERT INTO public.spa_transactions (
    user_id, amount, transaction_type, category, description, admin_id, created_at
  ) VALUES (
    p_user_id, p_amount, 'admin_adjustment', 'admin', p_reason, p_admin_id, NOW()
  ) RETURNING id INTO v_transaction_id;
  
  -- Update or insert user's SPA points
  INSERT INTO public.player_rankings (user_id, spa_points, created_at, updated_at)
  VALUES (p_user_id, p_amount, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    spa_points = COALESCE(player_rankings.spa_points, 0) + p_amount,
    updated_at = NOW();
  
  -- Create notification for user
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  VALUES (
    p_user_id,
    'spa_granted',
    'Nhận SPA Points',
    format('Bạn đã nhận %s SPA Points từ admin: %s', p_amount, p_reason),
    'normal'
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'transaction_id', v_transaction_id,
    'new_balance', v_current_spa + p_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;