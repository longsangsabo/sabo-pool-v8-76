-- Create missing tables for enhanced automation
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  player_id uuid NOT NULL,
  rank_id uuid,
  spa_points integer DEFAULT 0,
  wins integer DEFAULT 0,
  matches integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(week_start, player_id)
);

CREATE TABLE IF NOT EXISTS public.monthly_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL,
  player_id uuid NOT NULL,
  total_matches integer DEFAULT 0,
  wins integer DEFAULT 0,
  spa_points integer DEFAULT 0,
  rank_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(month, player_id)
);

CREATE TABLE IF NOT EXISTS public.season_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  season_number integer NOT NULL,
  final_rank_id uuid,
  total_spa_points integer DEFAULT 0,
  matches_played integer DEFAULT 0,
  tournaments_won integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(player_id, season_number)
);

-- Add missing column to player_rankings if it doesn't exist
ALTER TABLE public.player_rankings 
ADD COLUMN IF NOT EXISTS daily_challenges integer DEFAULT 0;

ALTER TABLE public.player_rankings 
ADD COLUMN IF NOT EXISTS tournament_wins integer DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Everyone can view leaderboard snapshots"
ON public.leaderboard_snapshots FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Everyone can view monthly snapshots"
ON public.monthly_snapshots FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Everyone can view season summaries"
ON public.season_summaries FOR SELECT
TO authenticated USING (true);

-- Enhanced daily challenge reset function
CREATE OR REPLACE FUNCTION public.reset_daily_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Reset daily challenge counter
  UPDATE public.player_rankings 
  SET daily_challenges = 0,
      updated_at = NOW();
  
  -- Log the reset operation
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'daily_reset',
    'Daily challenge limits reset',
    jsonb_build_object(
      'reset_date', CURRENT_DATE,
      'reset_time', NOW(),
      'players_reset', (SELECT COUNT(*) FROM public.player_rankings WHERE daily_challenges > 0)
    )
  );
END;
$function$;

-- Enhanced points decay for inactive players
CREATE OR REPLACE FUNCTION public.decay_inactive_spa_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  decay_amount INTEGER := 50;
  inactive_count INTEGER := 0;
BEGIN
  -- Find players inactive for >30 days and decay their points
  WITH inactive_players AS (
    SELECT p.user_id as id
    FROM public.profiles p
    LEFT JOIN public.matches m ON (m.player1_id = p.user_id OR m.player2_id = p.user_id) 
      AND m.created_at > NOW() - INTERVAL '30 days'
    LEFT JOIN public.player_rankings pr ON pr.player_id = p.user_id
    WHERE m.id IS NULL 
    AND pr.spa_points > 0
    AND pr.updated_at < NOW() - INTERVAL '30 days'
  )
  UPDATE public.player_rankings pr
  SET spa_points = GREATEST(0, spa_points - decay_amount),
      updated_at = NOW()
  FROM inactive_players ip
  WHERE pr.player_id = ip.id;
  
  -- Get count of affected players
  GET DIAGNOSTICS inactive_count = ROW_COUNT;
  
  -- Log the decay for each affected player
  INSERT INTO public.spa_points_log (player_id, source_type, points_earned, description)
  SELECT pr.player_id, 'decay', -decay_amount, 'Inactive penalty (30+ days)'
  FROM public.player_rankings pr
  WHERE pr.updated_at >= NOW() - INTERVAL '1 hour'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    LEFT JOIN public.matches m ON (m.player1_id = p.user_id OR m.player2_id = p.user_id) 
      AND m.created_at > NOW() - INTERVAL '30 days'
    WHERE m.id IS NULL AND p.user_id = pr.player_id
  );
  
  -- Log the operation
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'points_decay',
    'Applied points decay to inactive players',
    jsonb_build_object(
      'decay_amount', decay_amount,
      'affected_players', inactive_count,
      'threshold_days', 30
    )
  );
END;
$function$;

-- Weekly leaderboard snapshot function
CREATE OR REPLACE FUNCTION public.update_weekly_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  week_start_date date;
  snapshot_count INTEGER := 0;
BEGIN
  week_start_date := date_trunc('week', NOW())::date;
  
  -- Delete existing snapshot for this week
  DELETE FROM public.leaderboard_snapshots 
  WHERE week_start = week_start_date;
  
  -- Create new weekly snapshot
  INSERT INTO public.leaderboard_snapshots (
    week_start, player_id, rank_id, spa_points, wins, matches
  )
  SELECT 
    week_start_date,
    pr.player_id,
    pr.current_rank_id,
    pr.spa_points,
    pr.wins,
    pr.total_matches
  FROM public.player_rankings pr
  WHERE pr.spa_points > 0 OR pr.total_matches > 0
  ORDER BY pr.spa_points DESC;
  
  GET DIAGNOSTICS snapshot_count = ROW_COUNT;
  
  -- Log the operation
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'weekly_leaderboard',
    'Weekly leaderboard snapshot created',
    jsonb_build_object(
      'week_start', week_start_date,
      'players_included', snapshot_count
    )
  );
END;
$function$;

-- Monthly ranking report function
CREATE OR REPLACE FUNCTION public.send_monthly_reports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_month_start date;
  last_month_start date;
  reports_sent INTEGER := 0;
BEGIN
  current_month_start := date_trunc('month', NOW())::date;
  last_month_start := (date_trunc('month', NOW()) - INTERVAL '1 month')::date;
  
  -- Create monthly snapshots first
  INSERT INTO public.monthly_snapshots (month, player_id, total_matches, wins, spa_points, rank_id)
  SELECT 
    last_month_start,
    pr.player_id,
    pr.total_matches,
    pr.wins,
    pr.spa_points,
    pr.current_rank_id
  FROM public.player_rankings pr
  WHERE NOT EXISTS (
    SELECT 1 FROM public.monthly_snapshots ms 
    WHERE ms.player_id = pr.player_id AND ms.month = last_month_start
  )
  ON CONFLICT (month, player_id) DO UPDATE SET
    total_matches = EXCLUDED.total_matches,
    wins = EXCLUDED.wins,
    spa_points = EXCLUDED.spa_points,
    rank_id = EXCLUDED.rank_id;
  
  -- Send monthly reports to active players
  INSERT INTO public.notifications (user_id, type, title, message, metadata, priority)
  SELECT 
    pr.player_id,
    'monthly_report',
    'Báo cáo tháng của bạn',
    format('Tháng vừa qua: %s trận, %s thắng, %s SPA points', 
      COALESCE(pr.total_matches - COALESCE(last.total_matches, 0), 0),
      COALESCE(pr.wins - COALESCE(last.wins, 0), 0),
      COALESCE(pr.spa_points - COALESCE(last.spa_points, 0), 0)
    ),
    jsonb_build_object(
      'month', last_month_start,
      'matches_played', COALESCE(pr.total_matches - COALESCE(last.total_matches, 0), 0),
      'wins', COALESCE(pr.wins - COALESCE(last.wins, 0), 0),
      'spa_earned', COALESCE(pr.spa_points - COALESCE(last.spa_points, 0), 0),
      'current_rank', r.name
    ),
    'normal'
  FROM public.player_rankings pr
  LEFT JOIN public.monthly_snapshots last ON last.player_id = pr.player_id
    AND last.month = (last_month_start - INTERVAL '1 month')::date
  LEFT JOIN public.ranks r ON pr.current_rank_id = r.id
  WHERE pr.total_matches > 0 OR pr.spa_points > 0;
  
  GET DIAGNOSTICS reports_sent = ROW_COUNT;
  
  -- Log the operation
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'monthly_reports',
    'Monthly reports sent to players',
    jsonb_build_object(
      'month', last_month_start,
      'reports_sent', reports_sent
    )
  );
END;
$function$;

-- Enhanced season reset with summaries
CREATE OR REPLACE FUNCTION public.automated_season_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_season INTEGER;
  summaries_created INTEGER := 0;
  notifications_sent INTEGER := 0;
BEGIN
  current_season := EXTRACT(QUARTER FROM NOW() - INTERVAL '1 day')::INTEGER;
  
  -- Create season summaries before reset
  INSERT INTO public.season_summaries (
    player_id, season_number, final_rank_id, 
    total_spa_points, matches_played, tournaments_won
  )
  SELECT 
    pr.player_id,
    current_season,
    pr.current_rank_id,
    pr.spa_points,
    pr.total_matches,
    COALESCE(pr.tournament_wins, 0)
  FROM public.player_rankings pr
  WHERE pr.spa_points > 0 OR pr.total_matches > 0
  ON CONFLICT (player_id, season_number) DO UPDATE SET
    final_rank_id = EXCLUDED.final_rank_id,
    total_spa_points = EXCLUDED.total_spa_points,
    matches_played = EXCLUDED.matches_played,
    tournaments_won = EXCLUDED.tournaments_won;
  
  GET DIAGNOSTICS summaries_created = ROW_COUNT;
  
  -- Call the existing reset_season function
  PERFORM public.reset_season();
  
  -- Notify all active players about season reset
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  SELECT 
    p.user_id,
    'season_reset',
    'Mùa giải mới bắt đầu!',
    format('Mùa giải Q%s đã kết thúc. Điểm SPA đã được reset. Chúc bạn mùa giải mới thành công!', current_season),
    'high'
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM public.player_rankings pr 
    WHERE pr.player_id = p.user_id 
    AND (pr.spa_points > 0 OR pr.total_matches > 0)
  );
  
  GET DIAGNOSTICS notifications_sent = ROW_COUNT;
  
  -- Log the automated reset
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'automated_season_reset',
    'Automated season reset completed',
    jsonb_build_object(
      'season', current_season,
      'summaries_created', summaries_created,
      'notifications_sent', notifications_sent,
      'reset_date', CURRENT_DATE
    )
  );
END;
$function$;

-- System health check function
CREATE OR REPLACE FUNCTION public.system_health_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  health_data jsonb;
BEGIN
  -- Comprehensive health check
  SELECT jsonb_build_object(
    'timestamp', NOW(),
    'orphaned_matches', (
      SELECT COUNT(*) FROM public.matches 
      WHERE player1_id NOT IN (SELECT user_id FROM public.profiles)
         OR player2_id NOT IN (SELECT user_id FROM public.profiles)
    ),
    'invalid_rankings', (
      SELECT COUNT(*) FROM public.player_rankings
      WHERE current_rank_id IS NOT NULL 
      AND current_rank_id NOT IN (SELECT id FROM public.ranks)
    ),
    'pending_challenges', (
      SELECT COUNT(*) FROM public.challenges WHERE status = 'pending'
    ),
    'expired_challenges', (
      SELECT COUNT(*) FROM public.challenges 
      WHERE status = 'pending' AND expires_at < NOW()
    ),
    'unread_notifications', (
      SELECT COUNT(*) FROM public.notifications WHERE is_read = false
    ),
    'active_players_today', (
      SELECT COUNT(DISTINCT player_id) FROM public.spa_points_log
      WHERE created_at >= CURRENT_DATE
    ),
    'total_spa_points', (
      SELECT SUM(spa_points) FROM public.player_rankings
    ),
    'database_size', pg_size_pretty(pg_database_size(current_database()))
  ) INTO health_data;
  
  -- Log health check results
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'health_check',
    'Daily system health check completed',
    health_data
  );
  
  -- Alert if critical issues found
  IF (health_data->>'orphaned_matches')::integer > 0 OR 
     (health_data->>'invalid_rankings')::integer > 0 THEN
    
    INSERT INTO public.notifications (user_id, type, title, message, priority)
    SELECT 
      user_id,
      'system_alert',
      'Cảnh báo hệ thống',
      'Phát hiện lỗi dữ liệu. Vui lòng kiểm tra system logs.',
      'high'
    FROM public.profiles
    WHERE is_admin = true;
  END IF;
END;
$function$;

-- Update cron jobs with enhanced functions
SELECT cron.unschedule('daily-challenge-reset');
SELECT cron.unschedule('weekly-points-decay');

-- Enhanced daily jobs
SELECT cron.schedule(
  'reset-daily-challenges',
  '0 0 * * *', -- Every day at midnight
  'SELECT public.reset_daily_challenges();'
);

SELECT cron.schedule(
  'expire-old-challenges', 
  '0 1 * * *', -- Every day at 1 AM
  'SELECT public.cleanup_expired_challenges();'
);

-- Enhanced weekly jobs
SELECT cron.schedule(
  'decay-inactive-spa-points',
  '0 2 * * 0', -- Every Sunday at 2 AM
  'SELECT public.decay_inactive_spa_points();'
);

SELECT cron.schedule(
  'update-weekly-leaderboard',
  '0 3 * * 1', -- Every Monday at 3 AM
  'SELECT public.update_weekly_leaderboard();'
);

-- Monthly jobs
SELECT cron.schedule(
  'monthly-ranking-report',
  '0 4 1 * *', -- First day of month at 4 AM
  'SELECT public.send_monthly_reports();'
);

-- Quarterly season reset
SELECT cron.schedule(
  'season-reset',
  '0 5 1 */3 *', -- First day of Jan, Apr, Jul, Oct at 5 AM
  'SELECT public.automated_season_reset();'
);

-- Daily maintenance
SELECT cron.schedule(
  'system-health-check',
  '0 6 * * *', -- Every day at 6 AM
  'SELECT public.system_health_check();'
);