-- Add additional columns for tournament and player management
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS matches_scheduled boolean DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS activity_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_activity_check timestamp with time zone DEFAULT now();

-- Create function to get inactive players
CREATE OR REPLACE FUNCTION public.get_inactive_players(days_threshold integer)
RETURNS TABLE(user_id uuid, last_activity timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    GREATEST(
      COALESCE(MAX(m.created_at), p.created_at),
      COALESCE(MAX(mr.created_at), p.created_at),
      COALESCE(MAX(c.created_at), p.created_at)
    ) as last_activity
  FROM public.profiles p
  LEFT JOIN public.matches m ON (m.player1_id = p.user_id OR m.player2_id = p.user_id)
  LEFT JOIN public.match_results mr ON (mr.player1_id = p.user_id OR mr.player2_id = p.user_id)
  LEFT JOIN public.challenges c ON (c.challenger_id = p.user_id OR c.opponent_id = p.user_id)
  WHERE p.activity_status != 'inactive'
  GROUP BY p.user_id, p.created_at
  HAVING GREATEST(
    COALESCE(MAX(m.created_at), p.created_at),
    COALESCE(MAX(mr.created_at), p.created_at),
    COALESCE(MAX(c.created_at), p.created_at)
  ) < NOW() - INTERVAL '1 day' * days_threshold;
END;
$$;

-- Create cron jobs for the new automation functions
SELECT cron.schedule(
  'match-scheduling-automation',
  '0 */2 * * *', -- Every 2 hours
  $$
  select
    net.http_post(
        url:='https://knxevbkkkiadgppxbphh.supabase.co/functions/v1/match-scheduling-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueGV2Ymtra2lhZGdwcHhicGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODQ1NzMsImV4cCI6MjA2Njk2MDU3M30.bVpo1y8fZuX5y6pePpQafvAQtihY-nJOmsKL9QzRkW4"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'inactive-player-cleanup',
  '0 2 * * *', -- Daily at 2 AM
  $$
  select
    net.http_post(
        url:='https://knxevbkkkiadgppxbphh.supabase.co/functions/v1/inactive-player-cleanup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueGV2Ymtra2lhZGdwcHhicGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODQ1NzMsImV4cCI6MjA2Njk2MDU3M30.bVpo1y8fZuX5y6pePpQafvAQtihY-nJOmsKL9QzRkW4"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'auto-rank-promotion',
  '0 */6 * * *', -- Every 6 hours
  $$
  select
    net.http_post(
        url:='https://knxevbkkkiadgppxbphh.supabase.co/functions/v1/auto-rank-promotion',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueGV2Ymtra2lhZGdwcHhicGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODQ1NzMsImV4cCI6MjA2Njk2MDU3M30.bVpo1y8fZuX5y6pePpQafvAQtihY-nJOmsKL9QzRkW4"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'database-health-monitoring',
  '0 */4 * * *', -- Every 4 hours
  $$
  select
    net.http_post(
        url:='https://knxevbkkkiadgppxbphh.supabase.co/functions/v1/database-health-monitoring',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueGV2Ymtra2lhZGdwcHhicGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODQ1NzMsImV4cCI6MjA2Njk2MDU3M30.bVpo1y8fZuX5y6pePpQafvAQtihY-nJOmsKL9QzRkW4"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);