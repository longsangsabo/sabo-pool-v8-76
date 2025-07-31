-- Fix reference_id type mismatch in admin_credit_spa_points function

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
  
  -- Get current SPA points
  SELECT COALESCE(spa_points, 0) INTO v_current_spa
  FROM public.player_rankings
  WHERE player_id = p_user_id;
  
  -- If player ranking doesn't exist, create it
  IF v_current_spa IS NULL THEN
    INSERT INTO public.player_rankings (player_id, spa_points, total_matches, wins, losses)
    VALUES (p_user_id, 0, 0, 0, 0);
    v_current_spa := 0;
  END IF;
  
  -- Calculate new SPA amount
  v_new_spa := v_current_spa + p_amount;
  
  -- Update SPA points
  UPDATE public.player_rankings
  SET spa_points = v_new_spa,
      updated_at = NOW()
  WHERE player_id = p_user_id;
  
  -- Log transaction in spa_transactions table with proper UUID for reference_id
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
    gen_random_uuid(), -- Generate proper UUID instead of text
    'completed',
    p_admin_id
  ) RETURNING id INTO v_transaction_id;
  
  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'user_id', p_user_id,
    'old_amount', v_current_spa,
    'new_amount', v_new_spa,
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