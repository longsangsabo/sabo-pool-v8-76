-- MAJOR ISSUE 3: Secure materialized view access through function
-- Update backup record with correct approach
UPDATE public.migration_backups 
SET change_description = 'Created secure function-based access to mv_daily_ai_usage materialized view',
    rollback_notes = 'Function can be dropped if needed: DROP FUNCTION IF EXISTS public.get_daily_ai_usage();'
WHERE affected_component = 'Materialized views RLS';

-- Create a security definer function to control access to the materialized view
CREATE OR REPLACE FUNCTION public.get_daily_ai_usage()
RETURNS TABLE(
    date date,
    assistant_type text,
    model_name text,
    total_requests bigint,
    user_messages bigint,
    ai_responses bigint,
    successful_requests bigint,
    failed_requests bigint,
    total_tokens bigint,
    avg_response_time numeric,
    unique_users bigint,
    unique_sessions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only admins can access AI usage statistics
  IF NOT (SELECT public.is_current_user_admin()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT * FROM public.mv_daily_ai_usage;
END;
$function$;

-- Grant execute permission to authenticated users (security is handled in function)
GRANT EXECUTE ON FUNCTION public.get_daily_ai_usage() TO authenticated;