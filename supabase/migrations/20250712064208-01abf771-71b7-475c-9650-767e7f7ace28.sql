-- Complete SPA Credit Automation Workflow

-- 1. Enhanced function for complete SPA credit workflow
CREATE OR REPLACE FUNCTION public.admin_credit_spa_points_complete(
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
  v_user_exists BOOLEAN;
  v_user_name TEXT;
  v_admin_name TEXT;
  v_transaction_id UUID;
  v_wallet_balance INTEGER;
BEGIN
  -- 1. Validate admin permissions
  SELECT is_admin, full_name INTO v_admin_check, v_admin_name
  FROM public.profiles
  WHERE user_id = p_admin_id;
  
  IF NOT COALESCE(v_admin_check, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can credit SPA points';
  END IF;
  
  -- 2. Validate amount (must be positive for credits)
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive for credits';
  END IF;
  
  -- 3. Validate user exists and get current data
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END,
    MAX(p.full_name)
  INTO v_user_exists, v_user_name
  FROM public.profiles p
  WHERE p.user_id = p_user_id;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'User not found with ID: %', p_user_id;
  END IF;
  
  -- 4. Get current SPA points from player_rankings
  SELECT COALESCE(spa_points, 0) INTO v_current_spa
  FROM public.player_rankings
  WHERE player_id = p_user_id;
  
  -- 5. Create player ranking if doesn't exist
  IF v_current_spa IS NULL THEN
    INSERT INTO public.player_rankings (
      player_id, spa_points, elo_points, total_matches, wins, losses, win_streak
    )
    VALUES (p_user_id, 0, 1000, 0, 0, 0, 0);
    v_current_spa := 0;
  END IF;
  
  -- 6. Calculate new SPA amount
  v_new_spa := v_current_spa + p_amount;
  
  -- 7. Update SPA points in player_rankings
  UPDATE public.player_rankings
  SET spa_points = v_new_spa,
      updated_at = NOW()
  WHERE player_id = p_user_id;
  
  -- 8. Sync with wallets table
  INSERT INTO public.wallets (user_id, points_balance, balance, status)
  VALUES (p_user_id, v_new_spa, 0, 'active')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points_balance = v_new_spa,
    updated_at = NOW();
  
  -- 9. Create SPA transaction record
  INSERT INTO public.spa_transactions (
    user_id,
    amount,
    transaction_type,
    category,
    description,
    status,
    admin_id,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    'admin_adjustment',
    'admin_credit',
    p_reason,
    'completed',
    p_admin_id,
    jsonb_build_object(
      'admin_name', v_admin_name,
      'user_name', v_user_name,
      'old_spa', v_current_spa,
      'new_spa', v_new_spa,
      'credited_at', NOW()
    )
  ) RETURNING id INTO v_transaction_id;
  
  -- 10. Log admin action for audit trail
  INSERT INTO public.admin_actions (
    admin_id,
    target_user_id,
    action_type,
    action_details,
    reason
  ) VALUES (
    p_admin_id,
    p_user_id,
    'spa_credit',
    jsonb_build_object(
      'transaction_id', v_transaction_id,
      'amount_credited', p_amount,
      'old_spa', v_current_spa,
      'new_spa', v_new_spa,
      'user_name', v_user_name
    ),
    format('Credited %s SPA points to %s. Reason: %s', 
           p_amount, 
           COALESCE(v_user_name, 'Unknown User'), 
           p_reason)
  );
  
  -- 11. Create notification for user
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    priority,
    metadata
  ) VALUES (
    p_user_id,
    'spa_credit',
    'SPA Points Credited',
    format('You have been credited %s SPA points by admin. Your new balance is %s points.', 
           p_amount, v_new_spa),
    'normal',
    jsonb_build_object(
      'transaction_id', v_transaction_id,
      'amount', p_amount,
      'new_balance', v_new_spa,
      'admin_name', v_admin_name
    )
  );
  
  -- 12. Return comprehensive result
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'user_id', p_user_id,
    'user_name', v_user_name,
    'admin_id', p_admin_id,
    'admin_name', v_admin_name,
    'amount_credited', p_amount,
    'old_spa_balance', v_current_spa,
    'new_spa_balance', v_new_spa,
    'reason', p_reason,
    'timestamp', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error for debugging
    INSERT INTO public.error_logs (
      error_type,
      error_message,
      stack_trace,
      user_id,
      url
    ) VALUES (
      'spa_credit_error',
      SQLERRM,
      SQLSTATE,
      p_admin_id,
      'admin_credit_spa_points_complete'
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- 2. Create trigger to auto-sync SPA points between tables
CREATE OR REPLACE FUNCTION public.sync_spa_points_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update wallets table when player_rankings spa_points changes
  UPDATE public.wallets
  SET points_balance = NEW.spa_points,
      updated_at = NOW()
  WHERE user_id = NEW.player_id;
  
  -- Create wallet if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, points_balance, balance, status)
    VALUES (NEW.player_id, NEW.spa_points, 0, 'active');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Create trigger on player_rankings for auto-sync
DROP TRIGGER IF EXISTS trigger_sync_spa_points ON public.player_rankings;
CREATE TRIGGER trigger_sync_spa_points
  AFTER UPDATE OF spa_points ON public.player_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_spa_points_on_update();

-- 4. Function to validate SPA transaction before processing
CREATE OR REPLACE FUNCTION public.validate_spa_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validate user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'Invalid user_id: User does not exist';
  END IF;
  
  -- Validate admin exists if admin_id is provided
  IF NEW.admin_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = NEW.admin_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Invalid admin_id: Admin does not exist or is not an admin';
  END IF;
  
  -- Set processed_at if status is completed
  IF NEW.status = 'completed' AND NEW.processed_at IS NULL THEN
    NEW.processed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Create validation trigger on spa_transactions
DROP TRIGGER IF EXISTS trigger_validate_spa_transaction ON public.spa_transactions;
CREATE TRIGGER trigger_validate_spa_transaction
  BEFORE INSERT OR UPDATE ON public.spa_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_spa_transaction();

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_credit_spa_points_complete(UUID, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_spa_points_on_update() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_spa_transaction() TO authenticated;