-- Fix all remaining functions that reference player_id

-- Fix notify_spa_data_change function
CREATE OR REPLACE FUNCTION public.notify_spa_data_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Broadcast notification for frontend to refresh
  PERFORM pg_notify('spa_data_changed', json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'user_id', COALESCE(NEW.user_id, OLD.user_id),
    'timestamp', extract(epoch from now())
  )::text);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix sync_profile_rankings function
CREATE OR REPLACE FUNCTION public.sync_profile_rankings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Sync profile changes to player_rankings
  INSERT INTO public.player_rankings (user_id, updated_at)
  VALUES (NEW.user_id, NOW())
  ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();
  
  RETURN NEW;
END;
$function$;