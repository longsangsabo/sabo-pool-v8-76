-- Continue fixing security definer functions

-- Fix release_demo_users function
CREATE OR REPLACE FUNCTION public.release_demo_users(tournament_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  released_count INTEGER;
BEGIN
  -- Release users from specific tournament or all if 'all' is passed
  IF tournament_id = 'all' THEN
    UPDATE public.demo_user_pool 
    SET is_available = true, currently_used_in = null;
    GET DIAGNOSTICS released_count = ROW_COUNT;
  ELSE
    UPDATE public.demo_user_pool 
    SET is_available = true, currently_used_in = null
    WHERE currently_used_in = tournament_id;
    GET DIAGNOSTICS released_count = ROW_COUNT;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'released_count', released_count,
    'message', 'Demo users released and available for reuse'
  );
END;
$function$;

-- Fix get_demo_user_stats function
CREATE OR REPLACE FUNCTION public.get_demo_user_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  total_demo_users INTEGER;
  available_users INTEGER;
  in_use_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_demo_users
  FROM public.profiles WHERE is_demo_user = true;
  
  SELECT COUNT(*) INTO available_users
  FROM public.profiles p
  LEFT JOIN public.demo_user_pool dup ON dup.user_id = p.id
  WHERE p.is_demo_user = true
  AND (dup.is_available = true OR dup.is_available IS NULL);
  
  in_use_users := total_demo_users - available_users;
  
  RETURN jsonb_build_object(
    'total_demo_users', total_demo_users,
    'available_users', available_users,
    'in_use_users', in_use_users,
    'usage_percentage', ROUND((in_use_users::NUMERIC / NULLIF(total_demo_users, 0) * 100), 2)
  );
END;
$function$;