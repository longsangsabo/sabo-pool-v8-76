-- Fix the ambiguous column reference issue in admin_search_users function
DROP FUNCTION IF EXISTS public.admin_search_users(UUID, TEXT, INTEGER);

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

  -- Search users with properly aliased columns to avoid ambiguity
  RETURN QUERY
  SELECT 
    p.user_id as user_id,
    COALESCE(p.full_name, 'Unknown User') as full_name,
    COALESCE(p.display_name, p.full_name, 'Unknown') as display_name,
    COALESCE(p.phone, '') as phone,
    COALESCE(p.email, 
      (SELECT au.email FROM auth.users au WHERE au.id = p.user_id LIMIT 1), 
      ''
    ) as email,
    COALESCE(r.current_rank, 'Unranked') as current_rank,
    COALESCE(pr.spa_points, 0) as spa_points
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON pr.player_id = p.user_id
  LEFT JOIN public.ranks r ON r.id = pr.rank_id
  WHERE 
    p.is_demo_user IS NOT TRUE 
    AND p.user_id IS NOT NULL
    AND (
      p_search_query = '' OR
      p_search_query IS NULL OR
      LOWER(COALESCE(p.full_name, '')) ILIKE '%' || LOWER(p_search_query) || '%'
      OR LOWER(COALESCE(p.display_name, '')) ILIKE '%' || LOWER(p_search_query) || '%'
      OR COALESCE(p.phone, '') ILIKE '%' || p_search_query || '%'
      OR LOWER(COALESCE(p.email, 
        (SELECT au.email FROM auth.users au WHERE au.id = p.user_id LIMIT 1), 
        ''
      )) ILIKE '%' || LOWER(p_search_query) || '%'
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