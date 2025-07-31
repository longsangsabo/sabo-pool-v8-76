-- MAJOR ISSUE 1: Fix Function Security Path Problems
-- Backup record for rollback safety
INSERT INTO public.migration_backups (affected_component, change_description, rollback_notes)
VALUES 
('Security definer functions', 'Add SET search_path to security definer functions for security', 'Functions can be restored from backup if needed');

-- Fix reserve_demo_users function
CREATE OR REPLACE FUNCTION public.reserve_demo_users(user_ids uuid[], tournament_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Mark users as in use
  INSERT INTO public.demo_user_pool (user_id, is_available, currently_used_in, last_used_at)
  SELECT unnest(user_ids), false, tournament_id, now()
  ON CONFLICT (user_id) DO UPDATE SET
    is_available = false,
    currently_used_in = tournament_id,
    last_used_at = now();
  
  RETURN jsonb_build_object(
    'success', true, 
    'reserved_count', array_length(user_ids, 1),
    'tournament_id', tournament_id
  );
END;
$function$;