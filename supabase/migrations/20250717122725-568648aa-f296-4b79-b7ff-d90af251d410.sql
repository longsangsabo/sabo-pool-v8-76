-- MAJOR ISSUE 3: Enable RLS on materialized views
-- Backup record for rollback safety
INSERT INTO public.migration_backups (affected_component, change_description, rollback_notes)
VALUES 
('Materialized views RLS', 'Enable RLS on mv_daily_ai_usage materialized view', 'RLS can be disabled with: ALTER MATERIALIZED VIEW public.mv_daily_ai_usage DISABLE ROW LEVEL SECURITY;');

-- Enable RLS on the materialized view
ALTER MATERIALIZED VIEW public.mv_daily_ai_usage ENABLE ROW LEVEL SECURITY;

-- Create appropriate RLS policy for the materialized view
CREATE POLICY "Admins can view AI usage stats"
ON public.mv_daily_ai_usage
FOR SELECT 
TO authenticated
USING (is_current_user_admin());