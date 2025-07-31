-- Fix ambiguous column reference in search_users_for_admin function
DROP FUNCTION IF EXISTS public.search_users_for_admin(UUID, TEXT, INTEGER);

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
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE profiles.user_id = p_admin_id AND profiles.is_admin = true) THEN
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
    AND p.is_demo_user IS NOT TRUE
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