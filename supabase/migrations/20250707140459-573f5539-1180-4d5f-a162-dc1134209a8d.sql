-- Add bracket_generated column to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS bracket_generated boolean DEFAULT false;

-- Create cron jobs for tournament automation
SELECT cron.schedule(
  'auto-bracket-generation',
  '*/10 * * * *', -- Every 10 minutes
  $$
  select
    net.http_post(
        url:='https://knxevbkkkiadgppxbphh.supabase.co/functions/v1/auto-bracket-generation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueGV2Ymtra2lhZGdwcHhicGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODQ1NzMsImV4cCI6MjA2Njk2MDU3M30.bVpo1y8fZuX5y6pePpQafvAQtihY-nJOmsKL9QzRkW4"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'tournament-reminder-system',
  '*/15 * * * *', -- Every 15 minutes
  $$
  select
    net.http_post(
        url:='https://knxevbkkkiadgppxbphh.supabase.co/functions/v1/tournament-reminder-system',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueGV2Ymtra2lhZGdwcHhicGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODQ1NzMsImV4cCI6MjA2Njk2MDU3M30.bVpo1y8fZuX5y6pePpQafvAQtihY-nJOmsKL9QzRkW4"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);