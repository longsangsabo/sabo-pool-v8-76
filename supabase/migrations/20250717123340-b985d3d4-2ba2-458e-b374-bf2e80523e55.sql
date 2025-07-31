-- SECURITY CLEANUP PHASE 2: Final cleanup for tables only

-- 1. Enable RLS on tables that are missing it (skip views)

-- achievements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'achievements'
  ) THEN
    RAISE NOTICE 'achievements table does not exist, skipping';
  ELSE
    ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Everyone can view achievements" ON public.achievements;
    DROP POLICY IF EXISTS "Admins can manage achievements" ON public.achievements;
    
    -- Create new policies
    CREATE POLICY "Everyone can view achievements"
    ON public.achievements
    FOR SELECT 
    TO authenticated
    USING (true);
    
    CREATE POLICY "Admins can manage achievements"
    ON public.achievements
    FOR ALL
    TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());
  END IF;
END $$;

-- hashtags table 
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hashtags'
  ) THEN
    RAISE NOTICE 'hashtags table does not exist, skipping';
  ELSE
    ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Everyone can view hashtags" ON public.hashtags;
    DROP POLICY IF EXISTS "Users can create hashtags" ON public.hashtags;
    
    -- Create new policies
    CREATE POLICY "Everyone can view hashtags"
    ON public.hashtags
    FOR SELECT 
    TO authenticated
    USING (true);
    
    CREATE POLICY "Users can create hashtags"
    ON public.hashtags
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- demo_user_pool table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'demo_user_pool'
  ) THEN
    RAISE NOTICE 'demo_user_pool table does not exist, skipping';
  ELSE
    ALTER TABLE public.demo_user_pool ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Only system can manage demo user pool" ON public.demo_user_pool;
    
    -- Create new policies
    CREATE POLICY "Only system can manage demo user pool"
    ON public.demo_user_pool
    FOR ALL
    TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());
  END IF;
END $$;

-- cue_maintenance table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cue_maintenance'
  ) THEN
    RAISE NOTICE 'cue_maintenance table does not exist, skipping';
  ELSE
    ALTER TABLE public.cue_maintenance ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view all cue maintenance" ON public.cue_maintenance;
    DROP POLICY IF EXISTS "Users can manage cue maintenance" ON public.cue_maintenance;
    
    -- Create new policies
    CREATE POLICY "Users can view all cue maintenance"
    ON public.cue_maintenance
    FOR SELECT
    TO authenticated
    USING (true);
    
    CREATE POLICY "Users can manage cue maintenance"
    ON public.cue_maintenance
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- event_registrations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_registrations'
  ) THEN
    RAISE NOTICE 'event_registrations table does not exist, skipping';
  ELSE
    ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own event registrations" ON public.event_registrations;
    DROP POLICY IF EXISTS "Users can manage their own event registrations" ON public.event_registrations;
    
    -- Create new policies
    CREATE POLICY "Users can view their own event registrations"
    ON public.event_registrations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can manage their own event registrations"
    ON public.event_registrations
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events'
  ) THEN
    RAISE NOTICE 'events table does not exist, skipping';
  ELSE
    ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Everyone can view events" ON public.events;
    DROP POLICY IF EXISTS "Event creators can manage their events" ON public.events;
    
    -- Create new policies
    CREATE POLICY "Everyone can view events"
    ON public.events
    FOR SELECT
    TO authenticated
    USING (true);
    
    CREATE POLICY "Event creators can manage their events"
    ON public.events
    FOR ALL
    TO authenticated
    USING (auth.uid() = created_by OR public.is_current_user_admin())
    WITH CHECK (auth.uid() = created_by OR public.is_current_user_admin());
  END IF;
END $$;