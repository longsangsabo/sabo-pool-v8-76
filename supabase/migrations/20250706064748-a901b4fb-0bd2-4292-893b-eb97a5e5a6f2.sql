-- Enable required extensions for automation
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create daily challenge reset function
CREATE OR REPLACE FUNCTION public.reset_daily_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Reset daily challenge counts by clearing today's entries
  -- The spa_points_log entries remain for history
  -- But daily limits are based on created_at >= CURRENT_DATE
  
  -- Log the reset operation
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'daily_reset',
    'Daily challenge limits reset',
    jsonb_build_object(
      'reset_date', CURRENT_DATE,
      'reset_time', NOW()
    )
  );
  
  -- No actual data deletion needed since daily limits are calculated dynamically
  -- based on spa_points_log.created_at >= CURRENT_DATE
END;
$function$;

-- Create points decay function for inactive players
CREATE OR REPLACE FUNCTION public.apply_points_decay()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  decay_threshold_days INTEGER := 30; -- 30 days of inactivity
  decay_percentage NUMERIC := 0.05; -- 5% decay per week
BEGIN
  -- Apply SPA points decay to inactive players
  UPDATE public.player_rankings
  SET 
    spa_points = GREATEST(0, FLOOR(spa_points * (1 - decay_percentage))),
    updated_at = NOW()
  WHERE 
    updated_at < NOW() - INTERVAL '30 days'
    AND spa_points > 0;
    
  -- Log decay application
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'points_decay',
    'Applied points decay to inactive players',
    jsonb_build_object(
      'decay_percentage', decay_percentage,
      'threshold_days', decay_threshold_days,
      'affected_players', (
        SELECT COUNT(*) 
        FROM public.player_rankings 
        WHERE updated_at < NOW() - INTERVAL '30 days' AND spa_points > 0
      )
    )
  );
END;
$function$;

-- Create challenge cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Update expired challenges to 'expired' status
  UPDATE public.challenges
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status = 'pending'
    AND expires_at < NOW();
    
  -- Notify affected users about expired challenges
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  SELECT 
    challenger_id,
    'challenge_expired',
    'Thách đấu đã hết hạn',
    'Thách đấu của bạn đã hết hạn do không được phản hồi',
    'normal'
  FROM public.challenges
  WHERE status = 'expired' AND updated_at >= NOW() - INTERVAL '1 hour';
  
  -- Log cleanup operation
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'challenge_cleanup',
    'Cleaned up expired challenges',
    jsonb_build_object(
      'expired_count', (
        SELECT COUNT(*) 
        FROM public.challenges 
        WHERE status = 'expired' AND updated_at >= NOW() - INTERVAL '1 hour'
      )
    )
  );
END;
$function$;

-- Create weekly ranking recalculation function
CREATE OR REPLACE FUNCTION public.recalculate_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Clear existing leaderboard for current month
  DELETE FROM public.leaderboards 
  WHERE month = EXTRACT(MONTH FROM CURRENT_DATE)
    AND year = EXTRACT(YEAR FROM CURRENT_DATE);
    
  -- Recalculate leaderboard positions
  WITH ranked_players AS (
    SELECT 
      pr.player_id,
      pr.spa_points as ranking_points,
      pr.total_matches,
      pr.wins as total_wins,
      CASE 
        WHEN pr.total_matches > 0 THEN (pr.wins::numeric / pr.total_matches * 100)
        ELSE 0 
      END as win_rate,
      p.city,
      p.district,
      r.code as rank_category,
      ROW_NUMBER() OVER (ORDER BY pr.spa_points DESC, pr.wins DESC) as position
    FROM public.player_rankings pr
    JOIN public.profiles p ON pr.player_id = p.user_id
    LEFT JOIN public.ranks r ON pr.current_rank_id = r.id
    WHERE pr.spa_points > 0
  )
  INSERT INTO public.leaderboards (
    player_id, position, ranking_points, total_matches, total_wins, 
    win_rate, city, district, rank_category, month, year
  )
  SELECT 
    player_id, position, ranking_points, total_matches, total_wins,
    win_rate, city, district, rank_category,
    EXTRACT(MONTH FROM CURRENT_DATE)::integer,
    EXTRACT(YEAR FROM CURRENT_DATE)::integer
  FROM ranked_players;
  
  -- Log recalculation
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'ranking_recalculation',
    'Weekly ranking recalculation completed',
    jsonb_build_object(
      'players_ranked', (SELECT COUNT(*) FROM public.leaderboards 
                        WHERE month = EXTRACT(MONTH FROM CURRENT_DATE) 
                        AND year = EXTRACT(YEAR FROM CURRENT_DATE))
    )
  );
END;
$function$;

-- Create automated season management function
CREATE OR REPLACE FUNCTION public.check_season_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  last_reset_date DATE;
  should_reset BOOLEAN := FALSE;
BEGIN
  -- Get the last season reset date from system logs
  SELECT (metadata->>'reset_date')::date INTO last_reset_date
  FROM public.system_logs
  WHERE log_type = 'season_reset'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no previous reset, check if we're past the first quarter
  IF last_reset_date IS NULL THEN
    last_reset_date := DATE_TRUNC('year', CURRENT_DATE);
  END IF;
  
  -- Check if 3 months have passed since last reset
  IF last_reset_date + INTERVAL '3 months' <= CURRENT_DATE THEN
    should_reset := TRUE;
  END IF;
  
  -- Perform season reset if needed
  IF should_reset THEN
    PERFORM public.reset_season();
    
    -- Log the automated reset
    INSERT INTO public.system_logs (log_type, message, metadata)
    VALUES (
      'automated_season_reset',
      'Automated season reset executed',
      jsonb_build_object(
        'reset_date', CURRENT_DATE,
        'last_reset', last_reset_date,
        'quarter', EXTRACT(QUARTER FROM CURRENT_DATE)
      )
    );
  END IF;
END;
$function$;

-- Create system logs table for tracking automation
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on system logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for system logs (admins only)
CREATE POLICY "Admins can view system logs"
ON public.system_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Set up scheduled jobs using pg_cron
-- Daily challenge reset at midnight
SELECT cron.schedule(
  'daily-challenge-reset',
  '0 0 * * *', -- Every day at midnight
  'SELECT public.reset_daily_challenges();'
);

-- Weekly points decay on Sundays at 2 AM
SELECT cron.schedule(
  'weekly-points-decay',
  '0 2 * * 0', -- Every Sunday at 2 AM
  'SELECT public.apply_points_decay();'
);

-- Hourly challenge cleanup
SELECT cron.schedule(
  'hourly-challenge-cleanup',
  '0 * * * *', -- Every hour
  'SELECT public.cleanup_expired_challenges();'
);

-- Weekly ranking recalculation on Sundays at 3 AM
SELECT cron.schedule(
  'weekly-ranking-recalc',
  '0 3 * * 0', -- Every Sunday at 3 AM
  'SELECT public.recalculate_rankings();'
);

-- Monthly season check on the 1st of each month at 1 AM
SELECT cron.schedule(
  'monthly-season-check',
  '0 1 1 * *', -- 1st of every month at 1 AM
  'SELECT public.check_season_reset();'
);

-- Create notification cleanup job (monthly)
SELECT cron.schedule(
  'monthly-notification-cleanup',
  '0 1 1 * *', -- 1st of every month at 1 AM
  'DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL ''90 days'';'
);