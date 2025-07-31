-- Create missing RPC functions for admin SPA credit system

-- Function to search users for admin
CREATE OR REPLACE FUNCTION public.admin_search_users(
  p_admin_id uuid,
  p_search_query text,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  display_name text,
  phone text,
  email text,
  current_rank text,
  spa_points integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_admin_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.display_name,
    p.phone,
    p.email,
    COALESCE(pr.verified_rank, 'Unranked') as current_rank,
    COALESCE(pr.spa_points, 0) as spa_points
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id
  WHERE 
    p.is_visible = true
    AND p.deleted_at IS NULL
    AND (
      p.full_name ILIKE '%' || p_search_query || '%'
      OR p.display_name ILIKE '%' || p_search_query || '%'
      OR p.phone ILIKE '%' || p_search_query || '%'
      OR p.email ILIKE '%' || p_search_query || '%'
    )
  ORDER BY p.full_name
  LIMIT p_limit;
END;
$$;

-- Function to get SPA transaction history
CREATE OR REPLACE FUNCTION public.get_spa_transaction_history(
  p_admin_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  amount integer,
  transaction_type text,
  description text,
  created_at timestamp with time zone,
  admin_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_admin_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    st.id,
    st.user_id,
    COALESCE(up.full_name, up.display_name, 'Unknown User') as user_name,
    st.amount,
    st.transaction_type,
    st.description,
    st.created_at,
    COALESCE(ap.full_name, ap.display_name, 'System') as admin_name
  FROM public.spa_transactions st
  LEFT JOIN public.profiles up ON st.user_id = up.user_id
  LEFT JOIN public.profiles ap ON st.admin_id = ap.user_id
  WHERE st.status = 'completed'
  ORDER BY st.created_at DESC
  LIMIT p_limit;
END;
$$;