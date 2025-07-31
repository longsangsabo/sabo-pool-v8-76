-- Approach mới: Tạo function đơn giản hoàn toàn và xóa tất cả legacy code

-- 1. Xóa function cũ hoàn toàn
DROP FUNCTION IF EXISTS public.grant_spa_points(uuid, integer, uuid, text);

-- 2. Tạo function mới hoàn toàn đơn giản - chỉ thao tác trực tiếp với database
CREATE OR REPLACE FUNCTION public.simple_grant_spa_points(
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
  -- Basic validations
  IF spa_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Check admin status
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = granting_admin_id AND is_admin = true
  ) INTO v_admin_valid;
  
  IF NOT v_admin_valid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Check user exists
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE user_id = target_user_id
  ) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Get current SPA from player_rankings
  SELECT COALESCE(spa_points, 0) INTO v_current_spa
  FROM public.player_rankings 
  WHERE user_id = target_user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.player_rankings (user_id, spa_points, elo_points, total_matches, wins)
    VALUES (target_user_id, 0, 1000, 0, 0);
    v_current_spa := 0;
  END IF;

  -- Calculate new amount
  v_new_spa := v_current_spa + spa_amount;

  -- Update SPA points directly
  UPDATE public.player_rankings 
  SET spa_points = v_new_spa,
      updated_at = NOW()
  WHERE user_id = target_user_id;

  -- Sync with wallets table
  INSERT INTO public.wallets (user_id, points_balance, balance, status)
  VALUES (target_user_id, v_new_spa, 0, 'active')
  ON CONFLICT (user_id) DO UPDATE SET
    points_balance = v_new_spa,
    updated_at = NOW();

  -- Log transaction
  INSERT INTO public.spa_transactions (
    user_id, amount, transaction_type, category, description, admin_id, status
  ) VALUES (
    target_user_id, spa_amount, 'admin_grant', 'admin', grant_reason, granting_admin_id, 'completed'
  ) RETURNING id INTO v_transaction_id;

  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  VALUES (
    target_user_id,
    'spa_credited',
    'SPA Points Granted',
    format('You received %s SPA points from admin: %s', spa_amount, grant_reason),
    'normal'
  );

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'user_id', target_user_id,
    'old_balance', v_current_spa,
    'new_balance', v_new_spa,
    'amount_granted', spa_amount,
    'reason', grant_reason
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;