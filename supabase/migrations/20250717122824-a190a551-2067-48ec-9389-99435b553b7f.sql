-- Remove direct access to materialized view - force users to use secure function
REVOKE ALL ON public.mv_daily_ai_usage FROM public;
REVOKE ALL ON public.mv_daily_ai_usage FROM authenticated;

-- Only allow specific roles to access directly (for maintenance)
-- The public should use the secure function instead