-- Check and fix any materialized views that might have ambiguous references
-- Recreate admin_dashboard_stats view if it exists with explicit column references
DROP MATERIALIZED VIEW IF EXISTS admin_dashboard_stats;

CREATE MATERIALIZED VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.club_profiles cp WHERE cp.verification_status = 'approved') as active_clubs,
  (SELECT COUNT(*) FROM public.tournaments t WHERE t.status = 'active') as active_tournaments,
  (SELECT COUNT(*) FROM public.matches m WHERE m.created_at >= CURRENT_DATE - INTERVAL '30 days') as recent_matches,
  (SELECT COUNT(*) FROM public.rank_verifications rv WHERE rv.status = 'pending') as pending_verifications,
  (SELECT COUNT(*) FROM public.club_registrations cr WHERE cr.status = 'pending') as pending_registrations;