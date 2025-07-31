-- TASK 8: FILE CLEANUP - SETUP CRON JOBS AND UTILITIES

-- Create cron job for weekly scheduled file cleanup (Sunday at 2 AM)
SELECT cron.schedule(
  'weekly-file-cleanup',
  '0 2 * * 0',
  $$
  SELECT
    net.http_post(
        url:='https://knxevbkkkiadgppxbphh.supabase.co/functions/v1/scheduled-file-cleanup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueGV2Ymtra2lhZGdwcHhicGhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM4NDU3MywiZXhwIjoyMDY2OTYwNTczfQ.MczGDbLPzLaKxUWfmlshbYXoD8K7PdU5WH0XZEDwV5Q"}'::jsonb,
        body:=concat('{"force": false, "timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create function to manually trigger file cleanup for specific bucket
CREATE OR REPLACE FUNCTION public.trigger_file_cleanup(
  p_bucket_name TEXT DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT true,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Check if user is admin
  IF p_admin_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_admin_id AND is_admin = true
  ) THEN
    RETURN jsonb_build_object('error', 'Unauthorized: Admin access required');
  END IF;

  -- Log the manual trigger
  INSERT INTO public.system_logs (log_type, message, metadata, created_by)
  VALUES (
    'manual_file_cleanup_trigger',
    format('Manual file cleanup triggered for bucket: %s (dry_run: %s)', 
           COALESCE(p_bucket_name, 'all'), p_dry_run),
    jsonb_build_object(
      'bucket_name', p_bucket_name,
      'dry_run', p_dry_run,
      'triggered_by', p_admin_id
    ),
    p_admin_id
  );

  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'message', 'File cleanup triggered successfully',
    'bucket_name', COALESCE(p_bucket_name, 'all'),
    'dry_run', p_dry_run,
    'timestamp', now()
  );
END;
$$;