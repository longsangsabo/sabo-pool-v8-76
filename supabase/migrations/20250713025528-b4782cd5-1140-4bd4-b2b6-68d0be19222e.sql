-- COMPLETE PLATFORM RANK SYNCHRONIZATION - AUTOMATION FIRST
-- Fix all 5 critical issues identified in comprehensive audit

-- ============================================================================
-- PHASE 1: DATABASE SCHEMA STANDARDIZATION & MASTER AUTOMATION
-- ============================================================================

-- 1. CREATE CENTRALIZED USER_RANKS VIEW (Single Source of Truth)
CREATE OR REPLACE VIEW public.user_ranks AS
SELECT 
  p.user_id,
  p.display_name,
  p.verified_rank,
  p.elo as current_elo,
  pr.elo_points as ranking_elo,
  pr.verified_at,
  pr.verified_by,
  pr.club_verified,
  -- Computed fields for consistency
  CASE 
    WHEN p.elo >= 2100 THEN 'E+'
    WHEN p.elo >= 2000 THEN 'E'
    WHEN p.elo >= 1900 THEN 'F+'
    WHEN p.elo >= 1800 THEN 'F'
    WHEN p.elo >= 1700 THEN 'G+'
    WHEN p.elo >= 1600 THEN 'G'
    WHEN p.elo >= 1500 THEN 'H+'
    WHEN p.elo >= 1400 THEN 'H'
    WHEN p.elo >= 1300 THEN 'I+'
    WHEN p.elo >= 1200 THEN 'I'
    WHEN p.elo >= 1100 THEN 'K+'
    ELSE 'K'
  END as computed_rank,
  -- Rank display format
  CONCAT(
    COALESCE(p.verified_rank, 'K'),
    ' - ',
    COALESCE(p.elo, 1000),
    ' ELO'
  ) as rank_display,
  p.updated_at
FROM public.profiles p
LEFT JOIN public.player_rankings pr ON pr.user_id = p.user_id;

-- 2. MASTER RANK UPDATE TRIGGER - Cascades to ALL related tables
CREATE OR REPLACE FUNCTION public.master_rank_sync()
RETURNS TRIGGER AS $$
DECLARE
  v_rank_changed BOOLEAN := FALSE;
  v_elo_changed BOOLEAN := FALSE;
  v_old_rank TEXT;
  v_new_rank TEXT;
  v_old_elo INTEGER;
  v_new_elo INTEGER;
BEGIN
  -- Detect rank changes
  v_old_rank := OLD.verified_rank;
  v_new_rank := NEW.verified_rank;
  v_old_elo := OLD.elo;
  v_new_elo := NEW.elo;
  
  v_rank_changed := (v_old_rank IS DISTINCT FROM v_new_rank);
  v_elo_changed := (v_old_elo IS DISTINCT FROM v_new_elo);
  
  -- Only process if rank or ELO actually changed
  IF v_rank_changed OR v_elo_changed THEN
    BEGIN
      -- 1. SYNC PLAYER_RANKINGS TABLE
      INSERT INTO public.player_rankings (
        user_id, verified_rank, elo_points, verified_at, club_verified, created_at, updated_at
      ) VALUES (
        NEW.user_id, NEW.verified_rank, NEW.elo, NOW(), true, NOW(), NOW()
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        verified_rank = EXCLUDED.verified_rank,
        elo_points = EXCLUDED.elo_points,
        verified_at = EXCLUDED.verified_at,
        updated_at = NOW();

      -- 2. UPDATE CHALLENGE ELIGIBILITY (all active challenges)
      UPDATE public.challenges 
      SET updated_at = NOW()
      WHERE (challenger_id = NEW.user_id OR opponent_id = NEW.user_id)
        AND status IN ('pending', 'accepted', 'in_progress');

      -- 3. UPDATE TOURNAMENT REGISTRATIONS (if user is registered)
      UPDATE public.tournament_registrations 
      SET updated_at = NOW()
      WHERE player_id = NEW.user_id 
        AND tournament_id IN (
          SELECT id FROM public.tournaments 
          WHERE status IN ('upcoming', 'registration_open', 'in_progress')
        );

      -- 4. REFRESH LEADERBOARD CACHE (trigger recalculation)
      INSERT INTO public.rank_update_queue (user_id, old_rank, new_rank, old_elo, new_elo, created_at)
      VALUES (NEW.user_id, v_old_rank, v_new_rank, v_old_elo, v_new_elo, NOW());

      -- 5. BROADCAST REAL-TIME UPDATE
      PERFORM pg_notify(
        'rank_updated',
        json_build_object(
          'user_id', NEW.user_id,
          'old_rank', v_old_rank,
          'new_rank', v_new_rank,
          'old_elo', v_old_elo,
          'new_elo', v_new_elo,
          'rank_display', CONCAT(NEW.verified_rank, ' - ', NEW.elo, ' ELO'),
          'timestamp', extract(epoch from NOW())
        )::text
      );

      -- 6. LOG SUCCESS
      INSERT INTO public.error_logs (error_type, error_message, url, user_id, created_at)
      VALUES (
        'rank_sync_success',
        format('MASTER RANK SYNC: User %s rank updated from %s to %s (ELO: %s → %s)', 
               NEW.user_id, v_old_rank, v_new_rank, v_old_elo, v_new_elo),
        '/rank-sync',
        NEW.user_id,
        NOW()
      );

    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        INSERT INTO public.error_logs (error_type, error_message, url, user_id, created_at)
        VALUES (
          'rank_sync_error',
          format('MASTER RANK SYNC FAILED: %s | User: %s | Rank: %s → %s', 
                 SQLERRM, NEW.user_id, v_old_rank, v_new_rank),
          '/rank-sync',
          NEW.user_id,
          NOW()
        );
        RAISE WARNING 'Master rank sync failed: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ATTACH MASTER TRIGGER TO PROFILES TABLE
DROP TRIGGER IF EXISTS trigger_master_rank_sync ON public.profiles;
CREATE TRIGGER trigger_master_rank_sync
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.master_rank_sync();

-- 4. CREATE RANK UPDATE QUEUE TABLE (for background processing)
CREATE TABLE IF NOT EXISTS public.rank_update_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  old_rank TEXT,
  new_rank TEXT,
  old_elo INTEGER,
  new_elo INTEGER,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rank_update_queue_unprocessed 
ON public.rank_update_queue(created_at) WHERE NOT processed;

-- ============================================================================
-- PHASE 2: BACKGROUND SYNC AUTOMATION
-- ============================================================================

-- 5. BACKGROUND RANK CONSISTENCY CHECKER
CREATE OR REPLACE FUNCTION public.fix_rank_inconsistencies()
RETURNS INTEGER AS $$
DECLARE
  v_fixed_count INTEGER := 0;
  v_user RECORD;
BEGIN
  -- Find users with inconsistent rank data
  FOR v_user IN 
    SELECT 
      p.user_id,
      p.verified_rank as profile_rank,
      p.elo as profile_elo,
      pr.verified_rank as ranking_rank,
      pr.elo_points as ranking_elo
    FROM public.profiles p
    LEFT JOIN public.player_rankings pr ON pr.user_id = p.user_id
    WHERE p.verified_rank IS NOT NULL
      AND (
        pr.verified_rank IS NULL 
        OR pr.verified_rank != p.verified_rank
        OR pr.elo_points != p.elo
      )
  LOOP
    -- Fix player_rankings table
    INSERT INTO public.player_rankings (
      user_id, verified_rank, elo_points, verified_at, club_verified, created_at, updated_at
    ) VALUES (
      v_user.user_id, v_user.profile_rank, v_user.profile_elo, NOW(), true, NOW(), NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      verified_rank = EXCLUDED.verified_rank,
      elo_points = EXCLUDED.elo_points,
      verified_at = EXCLUDED.verified_at,
      updated_at = NOW();
    
    v_fixed_count := v_fixed_count + 1;
  END LOOP;
  
  RETURN v_fixed_count;
END;
$$ LANGUAGE plpgsql;

-- 6. AUTOMATED CACHE INVALIDATION FUNCTION
CREATE OR REPLACE FUNCTION public.invalidate_rank_cache(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- This would integrate with your cache system (Redis, etc.)
  -- For now, we'll use pg_notify to trigger frontend cache invalidation
  PERFORM pg_notify(
    'cache_invalidate',
    json_build_object(
      'type', 'user_rank',
      'user_id', p_user_id,
      'timestamp', extract(epoch from NOW())
    )::text
  );
  
  -- Mark for leaderboard refresh
  PERFORM pg_notify(
    'leaderboard_refresh',
    json_build_object(
      'user_id', p_user_id,
      'timestamp', extract(epoch from NOW())
    )::text
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 3: ENHANCED RANK REQUEST APPROVAL WORKFLOW
-- ============================================================================

-- 7. ENHANCED RANK APPROVAL TRIGGER (integrates with master sync)
CREATE OR REPLACE FUNCTION public.enhanced_rank_request_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_club_owner_id UUID;
  v_player_name TEXT;
  v_club_name TEXT;
  v_rank_text TEXT;
  v_elo_rank INTEGER;
BEGIN
  -- Get club owner ID (fixed from previous version)
  SELECT user_id INTO v_club_owner_id 
  FROM public.club_profiles 
  WHERE id = NEW.club_id;
  
  IF v_club_owner_id IS NULL THEN
    v_club_owner_id := NEW.club_id;
  END IF;
  
  -- Convert ELO to SABO rank
  v_elo_rank := CASE 
    WHEN NEW.requested_rank >= 2100 THEN 12  -- E+
    WHEN NEW.requested_rank >= 2000 THEN 11  -- E
    WHEN NEW.requested_rank >= 1900 THEN 10  -- F+
    WHEN NEW.requested_rank >= 1800 THEN 9   -- F
    WHEN NEW.requested_rank >= 1700 THEN 8   -- G+
    WHEN NEW.requested_rank >= 1600 THEN 7   -- G
    WHEN NEW.requested_rank >= 1500 THEN 6   -- H+
    WHEN NEW.requested_rank >= 1400 THEN 5   -- H
    WHEN NEW.requested_rank >= 1300 THEN 4   -- I+
    WHEN NEW.requested_rank >= 1200 THEN 3   -- I
    WHEN NEW.requested_rank >= 1100 THEN 2   -- K+
    ELSE 1  -- K
  END;
  
  v_rank_text := CASE v_elo_rank
    WHEN 1 THEN 'K'    WHEN 2 THEN 'K+'   WHEN 3 THEN 'I'    WHEN 4 THEN 'I+'
    WHEN 5 THEN 'H'    WHEN 6 THEN 'H+'   WHEN 7 THEN 'G'    WHEN 8 THEN 'G+'
    WHEN 9 THEN 'F'    WHEN 10 THEN 'F+'  WHEN 11 THEN 'E'   WHEN 12 THEN 'E+'
    ELSE 'K'
  END;
  
  -- Get names for notifications
  SELECT display_name INTO v_player_name FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT club_name INTO v_club_name FROM public.club_profiles WHERE id = NEW.club_id;
  
  -- Only process approved requests
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    BEGIN
      -- UPDATE PROFILES TABLE (this will trigger master_rank_sync automatically)
      UPDATE public.profiles 
      SET 
        verified_rank = v_rank_text,
        elo = NEW.requested_rank,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
      
      -- The master_rank_sync trigger will handle all other table updates
      
      -- Send notification
      INSERT INTO public.notifications (user_id, type, title, message, priority, metadata, created_at)
      VALUES (
        NEW.user_id,
        'rank_approved',
        'Hạng đã được xác thực',
        format('Hạng %s (%s ELO) của bạn đã được CLB "%s" xác thực thành công!', 
               v_rank_text, NEW.requested_rank, COALESCE(v_club_name, 'Unknown')),
        'high',
        jsonb_build_object(
          'rank', v_rank_text,
          'elo_rank', NEW.requested_rank,
          'rank_display', CONCAT(v_rank_text, ' - ', NEW.requested_rank, ' ELO'),
          'club_name', v_club_name,
          'approved_by', v_club_owner_id
        ),
        NOW()
      );
      
      -- Invalidate related caches
      PERFORM public.invalidate_rank_cache(NEW.user_id);
      
    EXCEPTION
      WHEN OTHERS THEN
        INSERT INTO public.error_logs (error_type, error_message, url, user_id, created_at)
        VALUES (
          'enhanced_approval_error',
          format('ENHANCED RANK APPROVAL FAILED: %s | User: %s | Rank: %s', 
                 SQLERRM, NEW.user_id, v_rank_text),
          '/rank-verification',
          NEW.user_id,
          NOW()
        );
        RAISE WARNING 'Enhanced rank approval failed: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. REPLACE EXISTING TRIGGER WITH ENHANCED VERSION
DROP TRIGGER IF EXISTS trigger_handle_rank_approval ON public.rank_requests;
CREATE TRIGGER trigger_enhanced_rank_approval
  AFTER UPDATE ON public.rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_rank_request_approval();

-- ============================================================================
-- PHASE 4: VERIFICATION & MONITORING
-- ============================================================================

-- 9. CREATE MONITORING VIEW
CREATE OR REPLACE VIEW public.rank_sync_monitor AS
SELECT 
  'profiles_without_rankings' as issue_type,
  COUNT(*) as count
FROM public.profiles p
LEFT JOIN public.player_rankings pr ON pr.user_id = p.user_id
WHERE p.verified_rank IS NOT NULL AND pr.user_id IS NULL

UNION ALL

SELECT 
  'inconsistent_ranks' as issue_type,
  COUNT(*) as count
FROM public.profiles p
JOIN public.player_rankings pr ON pr.user_id = p.user_id
WHERE p.verified_rank != pr.verified_rank OR p.elo != pr.elo_points

UNION ALL

SELECT 
  'unprocessed_queue_items' as issue_type,
  COUNT(*) as count
FROM public.rank_update_queue
WHERE NOT processed AND created_at < NOW() - INTERVAL '10 minutes';

-- 10. GRANT PERMISSIONS FOR REAL-TIME ACCESS
GRANT ALL ON public.user_ranks TO authenticated;
GRANT ALL ON public.rank_update_queue TO authenticated;
GRANT EXECUTE ON FUNCTION public.invalidate_rank_cache(UUID) TO authenticated;
GRANT SELECT ON public.rank_sync_monitor TO authenticated;

-- 11. IMMEDIATE CONSISTENCY FIX
SELECT public.fix_rank_inconsistencies() as fixed_count;