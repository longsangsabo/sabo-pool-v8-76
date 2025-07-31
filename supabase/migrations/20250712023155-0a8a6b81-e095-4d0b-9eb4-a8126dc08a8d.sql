-- Fix get_spa_transaction_history function for ambiguous column issue
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
  created_at TIMESTAMP WITH TIME ZONE,
  admin_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = p_admin_id AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get transaction history with proper aliases
  RETURN QUERY
  SELECT 
    st.id as id,
    st.user_id as user_id,
    COALESCE(up.full_name, up.display_name, 'Unknown User') as user_name,
    st.amount as amount,
    st.transaction_type as transaction_type,
    st.description as description,
    st.created_at as created_at,
    COALESCE(ap.full_name, ap.display_name, 'System') as admin_name
  FROM public.spa_transactions st
  LEFT JOIN public.profiles up ON up.user_id = st.user_id
  LEFT JOIN public.profiles ap ON ap.user_id = st.admin_id
  ORDER BY st.created_at DESC
  LIMIT p_limit;
END;
$$;