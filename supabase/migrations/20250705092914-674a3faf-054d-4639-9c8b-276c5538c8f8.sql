-- Phase 2: Real-time Improvements and Performance Optimization

-- 1. Enable realtime for club_registrations table
ALTER TABLE public.club_registrations REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.club_registrations;

-- 2. Enable realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.notifications;

-- 3. Enable realtime for club_profiles table
ALTER TABLE public.club_profiles REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.club_profiles;

-- 4. Additional performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_priority_created 
ON public.notifications(priority, created_at DESC) 
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_club_profiles_verification_status 
ON public.club_profiles(verification_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_club_profiles_user_verified 
ON public.club_profiles(user_id, verification_status);

-- 5. Create materialized view for admin dashboard stats
CREATE MATERIALIZED VIEW IF NOT EXISTS public.admin_dashboard_stats AS
SELECT 
  'club_registrations' as metric_type,
  jsonb_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'approved', COUNT(*) FILTER (WHERE status = 'approved'),
    'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
    'today_submissions', COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE),
    'this_week_submissions', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'approval_rate', CASE 
      WHEN COUNT(*) FILTER (WHERE status IN ('approved', 'rejected')) > 0 
      THEN ROUND(
        (COUNT(*) FILTER (WHERE status = 'approved')::numeric / 
         COUNT(*) FILTER (WHERE status IN ('approved', 'rejected'))::numeric) * 100, 2
      )
      ELSE 0
    END
  ) as stats
FROM public.club_registrations
UNION ALL
SELECT 
  'notifications' as metric_type,
  jsonb_build_object(
    'total', COUNT(*),
    'unread', COUNT(*) FILTER (WHERE is_read = false),
    'high_priority', COUNT(*) FILTER (WHERE priority = 'high' AND is_read = false),
    'today_notifications', COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)
  ) as stats
FROM public.notifications;

-- 6. Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_dashboard_stats_metric 
ON public.admin_dashboard_stats(metric_type);

-- 7. Function to refresh admin dashboard stats
CREATE OR REPLACE FUNCTION public.refresh_admin_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_dashboard_stats;
END;
$$;

-- 8. Create notification read function for better performance
CREATE OR REPLACE FUNCTION public.mark_notifications_read(
  notification_ids UUID[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications 
  SET is_read = true, updated_at = now()
  WHERE id = ANY(notification_ids) 
  AND user_id = auth.uid()
  AND is_read = false;
END;
$$;

-- 9. Create batch notification creation function
CREATE OR REPLACE FUNCTION public.create_bulk_notifications(
  notifications JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification JSONB;
BEGIN
  FOR notification IN SELECT * FROM jsonb_array_elements(notifications)
  LOOP
    INSERT INTO public.notifications (
      user_id, type, title, message, action_url, metadata, priority
    ) VALUES (
      (notification->>'user_id')::UUID,
      notification->>'type',
      notification->>'title',
      notification->>'message',
      notification->>'action_url',
      COALESCE(notification->'metadata', '{}'::jsonb),
      COALESCE(notification->>'priority', 'normal')
    );
  END LOOP;
END;
$$;

-- 10. Create trigger to refresh stats on club registration changes
CREATE OR REPLACE FUNCTION public.refresh_stats_on_club_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh stats asynchronously (won't block the main operation)
  PERFORM pg_notify('refresh_admin_stats', '');
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_club_registration_stats_refresh
  AFTER INSERT OR UPDATE OR DELETE ON public.club_registrations
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_stats_on_club_change();

-- 11. Add composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_club_registrations_composite_admin 
ON public.club_registrations(status, created_at DESC, approved_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_notifications_composite_user 
ON public.notifications(user_id, priority, is_read, created_at DESC);

-- 12. Create function for efficient notification summary
CREATE OR REPLACE FUNCTION public.get_notification_summary(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_unread', COUNT(*) FILTER (WHERE is_read = false),
    'high_priority_unread', COUNT(*) FILTER (WHERE is_read = false AND priority = 'high'),
    'recent_notifications', json_agg(
      json_build_object(
        'id', id,
        'type', type,
        'title', title,
        'message', message,
        'created_at', created_at,
        'priority', priority
      ) ORDER BY created_at DESC
    ) FILTER (WHERE is_read = false)
  ) INTO result
  FROM public.notifications
  WHERE user_id = target_user_id
  AND created_at >= now() - INTERVAL '7 days';
  
  RETURN result;
END;
$$;