-- Clean up and fix admin functions - comprehensive solution

-- Step 1: Drop all problematic functions to clean slate
DROP FUNCTION IF EXISTS public.admin_search_users(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_spa_transaction_history(UUID, INTEGER);

-- Step 2: Create simple, working admin_search_users function
CREATE OR REPLACE FUNCTION public.admin_search_users(
  p_admin_id UUID,
  p_search_query TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  display_name TEXT,
  phone TEXT,
  email TEXT,
  current_rank TEXT,
  spa_points INTEGER
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

  -- Simple search in profiles table only (no complex joins initially)
  RETURN QUERY
  SELECT 
    p.user_id as user_id,
    COALESCE(p.full_name, 'Unknown User') as full_name,
    COALESCE(p.display_name, p.full_name, 'Unknown') as display_name,
    COALESCE(p.phone, '') as phone,
    COALESCE(p.email, '') as email, -- Use profiles.email first
    'Unranked' as current_rank, -- Simplified for now
    0 as spa_points -- Simplified for now
  FROM public.profiles p
  WHERE 
    p.is_demo_user IS NOT TRUE 
    AND p.user_id IS NOT NULL
    AND (
      p_search_query = '' OR
      p_search_query IS NULL OR
      LOWER(COALESCE(p.full_name, '')) ILIKE '%' || LOWER(p_search_query) || '%'
      OR LOWER(COALESCE(p.display_name, '')) ILIKE '%' || LOWER(p_search_query) || '%'
      OR COALESCE(p.phone, '') ILIKE '%' || p_search_query || '%'
      OR LOWER(COALESCE(p.email, '')) ILIKE '%' || LOWER(p_search_query) || '%'
    )
  ORDER BY 
    CASE 
      WHEN p.phone = p_search_query THEN 1
      WHEN LOWER(COALESCE(p.full_name, '')) = LOWER(p_search_query) THEN 2
      WHEN LOWER(COALESCE(p.display_name, '')) = LOWER(p_search_query) THEN 3
      ELSE 5
    END,
    p.full_name NULLS LAST
  LIMIT p_limit;
END;
$$;

-- Step 3: Create simple, working get_spa_transaction_history function
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

  -- Get transaction history with proper table aliases
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

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_search_users(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_spa_transaction_history(UUID, INTEGER) TO authenticated;