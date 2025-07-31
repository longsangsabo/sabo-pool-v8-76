-- Phase 3: Enhanced soft delete functions for business logic entities
-- Function to migrate existing deleted records to soft delete pattern
CREATE OR REPLACE FUNCTION migrate_deleted_records()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  migrated_count INTEGER := 0;
  result jsonb;
BEGIN
  -- Migrate tournaments with status 'cancelled' to soft deleted
  UPDATE public.tournaments 
  SET deleted_at = updated_at,
      is_visible = false
  WHERE status = 'cancelled' 
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  
  -- Migrate challenges with status 'cancelled' to soft deleted
  UPDATE public.challenges 
  SET deleted_at = updated_at,
      is_visible = false
  WHERE status = 'cancelled' 
    AND deleted_at IS NULL;
  
  -- Migrate club profiles with verification_status 'rejected' to soft deleted
  UPDATE public.club_profiles 
  SET deleted_at = updated_at,
      is_visible = false
  WHERE verification_status = 'rejected' 
    AND deleted_at IS NULL;
  
  -- Create result summary
  result := jsonb_build_object(
    'success', true,
    'migrated_tournaments', (SELECT COUNT(*) FROM tournaments WHERE status = 'cancelled' AND deleted_at IS NOT NULL),
    'migrated_challenges', (SELECT COUNT(*) FROM challenges WHERE status = 'cancelled' AND deleted_at IS NOT NULL),
    'migrated_club_profiles', (SELECT COUNT(*) FROM club_profiles WHERE verification_status = 'rejected' AND deleted_at IS NOT NULL),
    'migration_timestamp', now()
  );
  
  RETURN result;
END;
$$;

-- Phase 4: Bulk operations for admin controls
CREATE OR REPLACE FUNCTION bulk_soft_delete(
  table_name text,
  entity_ids uuid[],
  admin_id uuid DEFAULT NULL
) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_count INTEGER;
  result jsonb;
BEGIN
  -- Use dynamic SQL to update any table
  EXECUTE format(
    'UPDATE %I SET deleted_at = now(), is_visible = false, updated_at = now() WHERE id = ANY($1) AND deleted_at IS NULL',
    table_name
  ) USING entity_ids;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  -- Log admin action
  IF admin_id IS NOT NULL THEN
    INSERT INTO admin_actions (admin_id, action_type, target_user_id, action_details)
    SELECT admin_id, 'bulk_soft_delete', unnest(entity_ids), 
           jsonb_build_object('table_name', table_name, 'count', affected_count);
  END IF;
  
  result := jsonb_build_object(
    'success', true,
    'table_name', table_name,
    'affected_count', affected_count,
    'entity_ids', to_jsonb(entity_ids)
  );
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION bulk_restore(
  table_name text,
  entity_ids uuid[],
  admin_id uuid DEFAULT NULL
) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_count INTEGER;
  result jsonb;
BEGIN
  -- Use dynamic SQL to restore any table
  EXECUTE format(
    'UPDATE %I SET deleted_at = NULL, is_visible = true, updated_at = now() WHERE id = ANY($1) AND deleted_at IS NOT NULL',
    table_name
  ) USING entity_ids;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  -- Log admin action
  IF admin_id IS NOT NULL THEN
    INSERT INTO admin_actions (admin_id, action_type, target_user_id, action_details)
    SELECT admin_id, 'bulk_restore', unnest(entity_ids), 
           jsonb_build_object('table_name', table_name, 'count', affected_count);
  END IF;
  
  result := jsonb_build_object(
    'success', true,
    'table_name', table_name,
    'affected_count', affected_count,
    'entity_ids', to_jsonb(entity_ids)
  );
  
  RETURN result;
END;
$$;

-- Phase 5: Data cleanup and maintenance
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  cleanup_result jsonb;
  orphaned_count INTEGER := 0;
BEGIN
  -- Clean up tournament registrations for deleted tournaments
  DELETE FROM tournament_registrations 
  WHERE tournament_id IN (
    SELECT id FROM tournaments WHERE deleted_at IS NOT NULL AND deleted_at < now() - INTERVAL '30 days'
  );
  GET DIAGNOSTICS orphaned_count = ROW_COUNT;
  
  -- Clean up match results for deleted tournaments
  DELETE FROM match_results 
  WHERE tournament_id IN (
    SELECT id FROM tournaments WHERE deleted_at IS NOT NULL AND deleted_at < now() - INTERVAL '30 days'
  );
  
  -- Clean up old permanently deleted records (deleted > 90 days ago)
  DELETE FROM tournaments WHERE deleted_at IS NOT NULL AND deleted_at < now() - INTERVAL '90 days';
  DELETE FROM challenges WHERE deleted_at IS NOT NULL AND deleted_at < now() - INTERVAL '90 days';
  DELETE FROM club_profiles WHERE deleted_at IS NOT NULL AND deleted_at < now() - INTERVAL '90 days';
  
  cleanup_result := jsonb_build_object(
    'success', true,
    'orphaned_registrations_cleaned', orphaned_count,
    'cleanup_timestamp', now(),
    'retention_policy_days', 90
  );
  
  RETURN cleanup_result;
END;
$$;

-- Phase 6: Monitoring and integrity checks
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  integrity_report jsonb;
  orphaned_registrations INTEGER;
  inconsistent_visibility INTEGER;
BEGIN
  -- Check for orphaned tournament registrations
  SELECT COUNT(*) INTO orphaned_registrations
  FROM tournament_registrations tr
  LEFT JOIN tournaments t ON tr.tournament_id = t.id
  WHERE t.id IS NULL;
  
  -- Check for inconsistent visibility (deleted but visible)
  SELECT COUNT(*) INTO inconsistent_visibility
  FROM tournaments 
  WHERE deleted_at IS NOT NULL AND is_visible = true;
  
  integrity_report := jsonb_build_object(
    'orphaned_tournament_registrations', orphaned_registrations,
    'inconsistent_visibility_tournaments', inconsistent_visibility,
    'check_timestamp', now(),
    'status', CASE 
      WHEN orphaned_registrations = 0 AND inconsistent_visibility = 0 THEN 'healthy'
      ELSE 'issues_found'
    END
  );
  
  RETURN integrity_report;
END;
$$;

-- Auto-cleanup scheduler setup (requires pg_cron extension)
-- This would typically be set up separately, but included for reference
-- SELECT cron.schedule('cleanup-soft-deleted', '0 2 * * 0', 'SELECT cleanup_orphaned_data();');

-- Create indexes for better performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_tournaments_deleted_visible ON tournaments(deleted_at, is_visible) WHERE deleted_at IS NOT NULL OR is_visible = false;
CREATE INDEX IF NOT EXISTS idx_challenges_deleted_visible ON challenges(deleted_at, is_visible) WHERE deleted_at IS NOT NULL OR is_visible = false;
CREATE INDEX IF NOT EXISTS idx_club_profiles_deleted_visible ON club_profiles(deleted_at, is_visible) WHERE deleted_at IS NOT NULL OR is_visible = false;
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_deleted_visible ON tournament_registrations(deleted_at, is_visible) WHERE deleted_at IS NOT NULL OR is_visible = false;
CREATE INDEX IF NOT EXISTS idx_match_results_deleted_visible ON match_results(deleted_at, is_visible) WHERE deleted_at IS NOT NULL OR is_visible = false;
CREATE INDEX IF NOT EXISTS idx_player_rankings_deleted_visible ON player_rankings(deleted_at, is_visible) WHERE deleted_at IS NOT NULL OR is_visible = false;
CREATE INDEX IF NOT EXISTS idx_events_deleted_visible ON events(deleted_at, is_visible) WHERE deleted_at IS NOT NULL OR is_visible = false;

-- Grant execute permissions to authenticated users for monitoring functions
GRANT EXECUTE ON FUNCTION check_data_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION get_soft_delete_stats() TO authenticated;