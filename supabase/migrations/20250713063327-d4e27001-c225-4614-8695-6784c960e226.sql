-- Fix all functions that still use player_id for spa_points_log table

-- 1. Fix credit_spa_points function to use user_id instead of player_id
CREATE OR REPLACE FUNCTION public.credit_spa_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_category TEXT DEFAULT 'match',
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_result JSONB;
BEGIN
  -- Create SPA transaction record using user_id
  INSERT INTO public.spa_transactions (
    user_id, amount, transaction_type, category, description, 
    reference_id, reference_type, metadata, status
  ) VALUES (
    p_user_id, p_amount, 
    CASE 
      WHEN p_amount > 0 THEN COALESCE(p_category || '_win', 'match_win')
      ELSE COALESCE(p_category || '_loss', 'match_loss')
    END,
    p_category, p_description, p_reference_id, p_reference_type, p_metadata, 'completed'
  ) RETURNING id INTO v_transaction_id;

  -- Update wallet balance
  INSERT INTO public.wallets (user_id, points_balance, status)
  VALUES (p_user_id, p_amount, 'active')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points_balance = wallets.points_balance + p_amount,
    updated_at = NOW()
  RETURNING points_balance INTO v_new_balance;

  -- Get previous balance
  v_current_balance := v_new_balance - p_amount;

  -- Update player rankings SPA points using user_id
  INSERT INTO public.player_rankings (user_id, spa_points, updated_at)
  VALUES (p_user_id, p_amount, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    spa_points = player_rankings.spa_points + p_amount,
    updated_at = NOW();

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'user_id', p_user_id,
    'amount_credited', p_amount,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'category', p_category,
    'description', p_description
  );

  RETURN v_result;
END;
$$;

-- 2. Fix debit_spa_points function if it exists
CREATE OR REPLACE FUNCTION public.debit_spa_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_category TEXT DEFAULT 'match',
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_current_spa INTEGER;
  v_result JSONB;
BEGIN
  -- Get current SPA points
  SELECT COALESCE(spa_points, 0) INTO v_current_spa
  FROM public.player_rankings
  WHERE user_id = p_user_id;

  -- Check if user has enough SPA points
  IF v_current_spa < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient SPA points',
      'current_spa', v_current_spa,
      'requested_amount', p_amount
    );
  END IF;

  -- Create SPA transaction record using user_id
  INSERT INTO public.spa_transactions (
    user_id, amount, transaction_type, category, description, 
    reference_id, reference_type, status
  ) VALUES (
    p_user_id, -p_amount, 
    COALESCE(p_category || '_debit', 'debit'),
    p_category, p_description, p_reference_id, p_reference_type, 'completed'
  ) RETURNING id INTO v_transaction_id;

  -- Update wallet balance
  UPDATE public.wallets 
  SET points_balance = points_balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING points_balance INTO v_new_balance;

  v_current_balance := v_new_balance + p_amount;

  -- Update player rankings SPA points using user_id
  UPDATE public.player_rankings
  SET spa_points = spa_points - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'user_id', p_user_id,
    'amount_debited', p_amount,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'category', p_category,
    'description', p_description
  );

  RETURN v_result;
END;
$$;