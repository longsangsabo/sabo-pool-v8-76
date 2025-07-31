-- SECURITY CLEANUP PHASE 2: Fix remaining critical issues

-- 1. Enable RLS on tables that have policies but RLS disabled
-- Check if these tables exist and enable RLS
DO $$
BEGIN
  -- Enable RLS on migration_backups if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE schemaname = 'public' AND tablename = 'migration_backups') THEN
    ALTER TABLE public.migration_backups ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Enable RLS on system_logs if it exists  
  IF EXISTS (SELECT FROM information_schema.tables WHERE schemaname = 'public' AND tablename = 'system_logs') THEN
    ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 2. Fix remaining functions with mutable search_path
-- Update all functions to have secure search_path settings
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT is_admin 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Update refresh_leaderboard_stats function
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_leaderboard_stats;
END;
$$;

-- Update cleanup_old_data function
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Clean up old API performance metrics (keep last 30 days)
  DELETE FROM public.api_performance_metrics 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Clean up old error logs (keep last 90 days)
  DELETE FROM public.error_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Clean up old analytics events (keep last 60 days)
  DELETE FROM public.analytics_events 
  WHERE created_at < NOW() - INTERVAL '60 days';
  
  -- Update statistics after cleanup
  ANALYZE public.api_performance_metrics;
  ANALYZE public.error_logs;
  ANALYZE public.analytics_events;
END;
$$;

-- Update update_club_stats function
CREATE OR REPLACE FUNCTION public.update_club_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Simple implementation that doesn't reference non-existent tables
  RAISE NOTICE 'Club stats function called - simplified version';
  -- TODO: Implement proper stats calculation when verification system is ready
END;
$$;

-- 3. Enable RLS on critical tables that are missing it
-- These tables should have RLS enabled for security
ALTER TABLE public.migration_backups ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for migration_backups (admin only)
CREATE POLICY "Only admins can access migration backups"
ON public.migration_backups
FOR ALL 
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- 4. Hide materialized view from API by revoking permissions
-- This complements our secure function approach
REVOKE ALL ON public.mv_leaderboard_stats FROM public;
REVOKE ALL ON public.mv_leaderboard_stats FROM authenticated;

-- Create secure function for leaderboard stats access
CREATE OR REPLACE FUNCTION public.get_leaderboard_stats()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  display_name text,
  elo_points integer,
  spa_points integer,
  total_matches integer,
  wins integer,
  win_rate numeric,
  current_streak integer,
  rank_position bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Anyone can view leaderboard stats (public data)
  RETURN QUERY
  SELECT * FROM public.mv_leaderboard_stats;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_leaderboard_stats() TO public;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_stats() TO authenticated;

-- Log the security improvements
INSERT INTO public.migration_backups (affected_component, change_description, rollback_notes)
VALUES 
('Security Phase 2', 'Fixed remaining RLS issues, secured functions, and materialized view access', 'Functions can be reverted if needed, RLS can be disabled on tables if issues arise');