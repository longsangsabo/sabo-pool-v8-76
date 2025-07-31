-- Phase 1: Standardize soft delete pattern across critical tables
-- Add deleted_at and is_visible columns to tables that need them

-- Profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Club profiles table  
ALTER TABLE public.club_profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Challenges table
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Tournament registrations table
ALTER TABLE public.tournament_registrations
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Match results table
ALTER TABLE public.match_results
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Player rankings table
ALTER TABLE public.player_rankings
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Post comments table
ALTER TABLE public.post_comments
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Create indexes for better performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_visible ON public.profiles(is_visible) WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_tournaments_deleted_at ON public.tournaments(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tournaments_visible ON public.tournaments(is_visible) WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_challenges_deleted_at ON public.challenges(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_challenges_visible ON public.challenges(is_visible) WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_deleted_at ON public.tournament_registrations(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_visible ON public.tournament_registrations(is_visible) WHERE is_visible = true;

-- Create utility function for soft delete
CREATE OR REPLACE FUNCTION public.soft_delete_entity(
  table_name text,
  entity_id uuid,
  deleted_by_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Execute dynamic SQL to update the specified table
  EXECUTE format(
    'UPDATE %I SET deleted_at = now(), is_visible = false, updated_at = now() WHERE id = $1',
    table_name
  ) USING entity_id;
  
  -- Log the soft delete action
  INSERT INTO public.admin_actions (
    admin_id, target_user_id, action_type, action_details, reason
  ) VALUES (
    COALESCE(deleted_by_user_id, auth.uid()),
    entity_id,
    'soft_delete',
    jsonb_build_object('table', table_name, 'entity_id', entity_id),
    'Soft delete via utility function'
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Create utility function for restore entity
CREATE OR REPLACE FUNCTION public.restore_entity(
  table_name text,
  entity_id uuid,
  restored_by_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Execute dynamic SQL to restore the specified entity
  EXECUTE format(
    'UPDATE %I SET deleted_at = NULL, is_visible = true, updated_at = now() WHERE id = $1',
    table_name
  ) USING entity_id;
  
  -- Log the restore action
  INSERT INTO public.admin_actions (
    admin_id, target_user_id, action_type, action_details, reason
  ) VALUES (
    COALESCE(restored_by_user_id, auth.uid()),
    entity_id,
    'restore',
    jsonb_build_object('table', table_name, 'entity_id', entity_id),
    'Restore via utility function'
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Create function to get soft delete statistics
CREATE OR REPLACE FUNCTION public.get_soft_delete_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats jsonb := '{}';
  table_stats jsonb;
  table_name text;
  tables text[] := ARRAY[
    'tournaments', 'profiles', 'challenges', 'tournament_registrations', 
    'match_results', 'player_rankings', 'events', 'notifications'
  ];
BEGIN
  -- Check each table for soft delete statistics
  FOREACH table_name IN ARRAY tables
  LOOP
    BEGIN
      EXECUTE format(
        'SELECT jsonb_build_object(
          ''total'', COUNT(*),
          ''visible'', COUNT(*) FILTER (WHERE is_visible = true OR is_visible IS NULL),
          ''deleted'', COUNT(*) FILTER (WHERE deleted_at IS NOT NULL),
          ''hidden'', COUNT(*) FILTER (WHERE is_visible = false AND deleted_at IS NULL)
        ) FROM %I',
        table_name
      ) INTO table_stats;
      
      stats := stats || jsonb_build_object(table_name, table_stats);
    EXCEPTION
      WHEN OTHERS THEN
        -- Skip tables that don't have the columns yet
        CONTINUE;
    END;
  END LOOP;
  
  RETURN stats;
END;
$$;