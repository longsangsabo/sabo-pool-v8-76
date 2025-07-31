-- Fix remaining critical functions with player_id references

-- 5. Fix admin_credit_spa_points_complete function
CREATE OR REPLACE FUNCTION public.admin_credit_spa_points_complete(p_user_id uuid, p_amount integer, p_reason text, p_admin_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
  
  -- 4. Get current SPA points from player_rankings (FIXED: using user_id)
  SELECT COALESCE(spa_points, 0) INTO v_current_spa
  FROM public.player_rankings
  WHERE user_id = p_user_id;
  
  -- 5. Create player ranking if doesn't exist (FIXED: using user_id)
  IF v_current_spa IS NULL THEN
    INSERT INTO public.player_rankings (
      user_id, spa_points, elo_points, total_matches, wins, losses, win_streak
    )
    VALUES (p_user_id, 0, 1000, 0, 0, 0, 0);
    v_current_spa := 0;
  END IF;
  
  -- 6. Calculate new SPA amount
  v_new_spa := v_current_spa + p_amount;
  
  -- 7. Update SPA points in player_rankings (FIXED: using user_id)
  UPDATE public.player_rankings
  SET spa_points = v_new_spa,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
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
$function$;

-- 6. Fix admin_register_test_users_to_tournament functions
CREATE OR REPLACE FUNCTION public.admin_register_test_users_to_tournament(p_tournament_id uuid, p_test_user_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_id_var uuid;
  registrations_created INTEGER := 0;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    RETURN jsonb_build_object('error', 'Unauthorized: Admin access required');
  END IF;

  -- Register each test user to the tournament (FIXED: using user_id)
  FOREACH user_id_var IN ARRAY p_test_user_ids
  LOOP
    INSERT INTO public.tournament_registrations (
      tournament_id,
      user_id,
      registration_status,
      payment_status,
      registration_date,
      created_at
    ) VALUES (
      p_tournament_id,
      user_id_var,
      'confirmed',
      'paid',
      now(),
      now()
    ) ON CONFLICT (tournament_id, user_id) DO NOTHING;
    
    registrations_created := registrations_created + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'registrations_created', registrations_created,
    'tournament_id', p_tournament_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to register test users: ' || SQLERRM
    );
END;
$function$;