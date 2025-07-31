-- Create secure admin function to credit SPA points with proper transaction logging
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
  
  -- Log transaction in spa_transactions table
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

-- Grant permission to authenticated users (admin check is done inside function)
GRANT EXECUTE ON FUNCTION public.admin_credit_spa_points(UUID, INTEGER, TEXT, UUID) TO authenticated;

-- Create function to get SPA transaction history for admin audit
CREATE OR REPLACE FUNCTION public.get_spa_transaction_history(
  p_admin_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_name TEXT,
  amount INTEGER,
  transaction_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  admin_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin_check BOOLEAN;
BEGIN
  -- Check if the calling user is an admin
  SELECT is_admin INTO v_admin_check
  FROM public.profiles
  WHERE user_id = p_admin_id;
  
  IF NOT COALESCE(v_admin_check, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view transaction history';
  END IF;
  
  RETURN QUERY
  SELECT 
    st.id,
    st.user_id,
    COALESCE(p.full_name, p.display_name, 'Unknown User') as user_name,
    st.amount,
    st.transaction_type,
    st.description,
    st.created_at,
    COALESCE(admin_p.full_name, admin_p.display_name, 'System') as admin_name
  FROM public.spa_transactions st
  LEFT JOIN public.profiles p ON st.user_id = p.user_id
  LEFT JOIN public.profiles admin_p ON st.admin_id = admin_p.user_id
  WHERE st.transaction_type IN ('admin_credit', 'admin_adjustment', 'admin_reset')
  ORDER BY st.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant permission to authenticated users (admin check is done inside function)
GRANT EXECUTE ON FUNCTION public.get_spa_transaction_history(UUID, INTEGER) TO authenticated;

-- Create function to search users for admin selection
CREATE OR REPLACE FUNCTION public.admin_search_users(
  p_admin_id UUID,
  p_search_query TEXT DEFAULT '',
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  display_name TEXT,
  current_rank TEXT,
  spa_points INTEGER,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin_check BOOLEAN;
BEGIN
  -- Check if the calling user is an admin
  SELECT is_admin INTO v_admin_check
  FROM public.profiles
  WHERE user_id = p_admin_id;
  
  IF NOT COALESCE(v_admin_check, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can search users';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.display_name,
    COALESCE(p.current_rank, 'Unranked') as current_rank,
    COALESCE(pr.spa_points, 0) as spa_points,
    p.email
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.player_id
  WHERE 
    (p_search_query = '' OR 
     p.full_name ILIKE '%' || p_search_query || '%' OR
     p.display_name ILIKE '%' || p_search_query || '%' OR
     p.email ILIKE '%' || p_search_query || '%')
  ORDER BY 
    COALESCE(pr.spa_points, 0) DESC,
    p.full_name ASC
  LIMIT p_limit;
END;
$$;

-- Grant permission to authenticated users (admin check is done inside function)
GRANT EXECUTE ON FUNCTION public.admin_search_users(UUID, TEXT, INTEGER) TO authenticated;