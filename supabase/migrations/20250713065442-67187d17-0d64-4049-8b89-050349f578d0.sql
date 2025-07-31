-- Create grant_spa_points function
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
  
  -- Insert transaction record
  INSERT INTO public.spa_transactions (
    user_id, amount, transaction_type, description, admin_id, created_at
  ) VALUES (
    p_user_id, p_amount, 'admin_grant', p_reason, p_admin_id, NOW()
  ) RETURNING id INTO v_transaction_id;
  
  -- Update user's SPA points
  INSERT INTO public.player_rankings (user_id, spa_points)
  VALUES (p_user_id, p_amount)
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

-- Create function to search users for admin
CREATE OR REPLACE FUNCTION public.search_users_for_admin(
  p_admin_id UUID,
  p_search_query TEXT DEFAULT '',
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  display_name TEXT,
  phone TEXT,
  current_spa INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Validate admin
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = p_admin_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Unauthorized: Not admin';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.display_name,
    p.phone,
    COALESCE(pr.spa_points, 0) as current_spa
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id
  WHERE 
    p.deleted_at IS NULL
    AND (
      p_search_query = '' OR
      p.full_name ILIKE '%' || p_search_query || '%' OR
      p.display_name ILIKE '%' || p_search_query || '%' OR
      p.phone ILIKE '%' || p_search_query || '%'
    )
  ORDER BY p.full_name
  LIMIT p_limit;
END;
$$;