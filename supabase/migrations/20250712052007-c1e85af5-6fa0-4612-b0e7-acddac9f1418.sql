-- Enable realtime for wallet and player_rankings tables
ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE player_rankings;
ALTER PUBLICATION supabase_realtime ADD TABLE spa_points_log;

-- Create notification function for data changes
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
    'user_id', COALESCE(NEW.user_id, NEW.player_id, OLD.user_id, OLD.player_id),
    'timestamp', extract(epoch from now())
  )::text);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add triggers for real-time notifications
DROP TRIGGER IF EXISTS notify_wallet_changes ON public.wallets;
CREATE TRIGGER notify_wallet_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_spa_data_change();

DROP TRIGGER IF EXISTS notify_ranking_changes ON public.player_rankings;
CREATE TRIGGER notify_ranking_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.player_rankings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_spa_data_change();

-- Create comprehensive data sync function
CREATE OR REPLACE FUNCTION public.ensure_spa_data_consistency()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  sync_count INTEGER := 0;
  missing_wallets INTEGER := 0;
  missing_rankings INTEGER := 0;
BEGIN
  -- Create missing wallet records
  WITH missing_wallet_users AS (
    INSERT INTO public.wallets (user_id, balance, points_balance, status)
    SELECT 
      p.user_id,
      0 as balance,
      COALESCE(pr.spa_points, 50) as points_balance,
      'active' as status
    FROM public.profiles p
    LEFT JOIN public.wallets w ON w.user_id = p.user_id
    LEFT JOIN public.player_rankings pr ON pr.player_id = p.user_id
    WHERE w.user_id IS NULL
    ON CONFLICT (user_id) DO NOTHING
    RETURNING user_id
  )
  SELECT COUNT(*) INTO missing_wallets FROM missing_wallet_users;

  -- Create missing player_rankings records
  WITH missing_ranking_users AS (
    INSERT INTO public.player_rankings (
      player_id, elo_points, spa_points, total_matches, wins, 
      daily_challenges, tournament_wins, rank_points, 
      average_opponent_strength, performance_quality, club_verified, is_visible
    )
    SELECT 
      p.user_id,
      1000 as elo_points,
      COALESCE(w.points_balance, 50) as spa_points,
      0 as total_matches,
      0 as wins,
      0 as daily_challenges,
      0 as tournament_wins,
      0 as rank_points,
      0 as average_opponent_strength,
      0 as performance_quality,
      false as club_verified,
      true as is_visible
    FROM public.profiles p
    LEFT JOIN public.player_rankings pr ON pr.player_id = p.user_id
    LEFT JOIN public.wallets w ON w.user_id = p.user_id
    WHERE pr.player_id IS NULL
    ON CONFLICT (player_id) DO NOTHING
    RETURNING player_id
  )
  SELECT COUNT(*) INTO missing_rankings FROM missing_ranking_users;

  -- Sync mismatched data between wallets and player_rankings
  WITH synced_data AS (
    UPDATE public.player_rankings 
    SET spa_points = w.points_balance,
        updated_at = now()
    FROM public.wallets w
    WHERE player_rankings.player_id = w.user_id
    AND player_rankings.spa_points != w.points_balance
    RETURNING player_rankings.player_id
  )
  SELECT COUNT(*) INTO sync_count FROM synced_data;

  -- Log the sync operation
  RAISE NOTICE 'SPA Data Sync Complete: % wallets created, % rankings created, % records synced', 
    missing_wallets, missing_rankings, sync_count;
    
  -- Broadcast sync completion
  PERFORM pg_notify('spa_sync_completed', json_build_object(
    'missing_wallets', missing_wallets,
    'missing_rankings', missing_rankings,
    'synced_records', sync_count,
    'timestamp', extract(epoch from now())
  )::text);
END;
$function$;

-- Run the consistency check
SELECT public.ensure_spa_data_consistency();