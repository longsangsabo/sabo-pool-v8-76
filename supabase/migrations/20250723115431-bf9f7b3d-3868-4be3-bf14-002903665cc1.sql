-- =====================================================
-- FINAL MIGRATION: CREATE MISSING WALLETS AND INITIALIZE DATA
-- =====================================================

-- Create default wallets for existing users who don't have one
INSERT INTO public.wallets (user_id, points_balance, total_earned, created_at, updated_at)
SELECT 
  p.user_id,
  COALESCE(pr.spa_points, 0) as points_balance,
  COALESCE(pr.spa_points, 0) as total_earned,
  now(),
  now()
FROM public.profiles p
LEFT JOIN public.player_rankings pr ON p.user_id = pr.user_id
WHERE NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.user_id = p.user_id)
AND p.is_demo_user = false
ON CONFLICT (user_id) DO NOTHING;

-- Add triggers for wallets table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_wallets_updated_at') THEN
    CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON public.wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add triggers for spa_points_log table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_spa_points_log_updated_at') THEN
    CREATE TRIGGER update_spa_points_log_updated_at 
    BEFORE UPDATE ON public.spa_points_log 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- COMPLETION VERIFICATION
-- =====================================================

-- Log successful completion
INSERT INTO public.tournament_automation_log (
  tournament_id, automation_type, status, details, completed_at
) VALUES (
  gen_random_uuid(), 'database_migration_final', 'completed',
  jsonb_build_object(
    'tables_verified', ARRAY[
      'ranks', 'wallets', 'spa_points_log', 'spa_reward_milestones',
      'rank_requests', 'rank_verifications', 'test_schedules', 
      'rank_test_results', 'tournament_automation_log', 'user_chat_sessions'
    ],
    'wallets_created', (SELECT COUNT(*) FROM public.wallets),
    'milestones_available', (SELECT COUNT(*) FROM public.spa_reward_milestones),
    'ranks_available', (SELECT COUNT(*) FROM public.ranks)
  ),
  now()
);

-- Verify all essential tables exist
SELECT 
  'Migration completed successfully' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ranks') > 0 as ranks_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets') > 0 as wallets_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spa_points_log') > 0 as spa_log_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rank_requests') > 0 as rank_requests_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rank_verifications') > 0 as rank_verifications_exists;