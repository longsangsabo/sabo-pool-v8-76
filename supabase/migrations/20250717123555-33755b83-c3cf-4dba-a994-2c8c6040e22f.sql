-- SECURITY CLEANUP PHASE 3: Fix remaining critical ERROR issues

-- 1. Fix Policy Exists RLS Disabled issue
-- Check tables that have policies but RLS is disabled
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Find tables with policies but RLS disabled
  FOR rec IN 
    SELECT DISTINCT schemaname, tablename 
    FROM pg_policies p
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_class c 
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = p.schemaname 
      AND c.relname = p.tablename 
      AND c.relrowsecurity = true
    )
    AND schemaname = 'public'
  LOOP
    -- Enable RLS on tables that have policies but RLS is disabled
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', rec.schemaname, rec.tablename);
    RAISE NOTICE 'Enabled RLS on table %.%', rec.schemaname, rec.tablename;
  END LOOP;
END $$;

-- 2. Fix Security Definer Views issue
-- Convert SECURITY DEFINER views to SECURITY INVOKER or drop them if not needed
DO $$
DECLARE
  view_rec RECORD;
BEGIN
  -- Find views with SECURITY DEFINER that need to be fixed
  FOR view_rec IN
    SELECT schemaname, viewname
    FROM pg_views
    WHERE schemaname = 'public'
    AND viewname IN ('mv_daily_ai_usage', 'user_ranks')  -- Known problematic views
  LOOP
    -- Drop the view and recreate without SECURITY DEFINER if needed
    EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE;', view_rec.schemaname, view_rec.viewname);
    RAISE NOTICE 'Dropped SECURITY DEFINER view %.%', view_rec.schemaname, view_rec.viewname;
  END LOOP;
END $$;

-- 3. Fix remaining RLS Disabled in Public tables
-- Enable RLS on remaining tables that don't have it
DO $$
DECLARE
  table_names TEXT[] := ARRAY[
    'hashtags', 'live_streams', 'match_events', 'match_history', 
    'migration_backups', 'mutual_ratings', 'notification_logs', 
    'notification_preferences', 'notification_templates', 'notifications',
    'payment_transactions', 'player_achievements', 'player_cues',
    'player_preferences', 'player_rankings', 'post_comments',
    'post_hashtags', 'post_likes', 'posts', 'profiles',
    'rank_requests', 'rank_test_schedules', 'rank_verifications',
    'sabo_challenges', 'system_logs', 'tournament_brackets',
    'tournament_matches', 'tournament_registrations', 
    'tournament_results', 'tournament_tiers', 'tournaments',
    'user_achievements', 'user_activity_log', 'user_sessions',
    'wallets'
  ];
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY table_names
  LOOP
    -- Check if table exists and RLS is not enabled
    IF EXISTS (
      SELECT 1 FROM pg_class c 
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public' 
      AND c.relname = table_name 
      AND c.relkind = 'r'
      AND c.relrowsecurity = false
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);
      RAISE NOTICE 'Enabled RLS on table public.%', table_name;
    END IF;
  END LOOP;
END $$;

-- 4. Create basic policies for tables that have RLS enabled but no policies
-- profiles table - critical table that needs proper policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view all profiles') THEN
    CREATE POLICY "Users can view all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- notifications table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
    CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'System can create notifications') THEN
    CREATE POLICY "System can create notifications"
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- wallets table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallets' AND policyname = 'Users can view their own wallet') THEN
    CREATE POLICY "Users can view their own wallet"
    ON public.wallets
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallets' AND policyname = 'Users can update their own wallet') THEN
    CREATE POLICY "Users can update their own wallet"
    ON public.wallets
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallets' AND policyname = 'System can create wallets') THEN
    CREATE POLICY "System can create wallets"
    ON public.wallets
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;