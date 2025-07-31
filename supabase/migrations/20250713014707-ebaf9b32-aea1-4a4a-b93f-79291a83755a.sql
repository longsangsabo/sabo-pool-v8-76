-- COMPLETE RANK VERIFICATION SYSTEM FIX
-- Fix all critical issues identified by analysis

-- 1. ADD MISSING UNIQUE CONSTRAINT (CRITICAL)
-- This fixes the "ON CONFLICT specification" error
ALTER TABLE public.rank_verifications 
ADD CONSTRAINT unique_user_club_verification 
UNIQUE (user_id, club_id);

-- 2. DROP AND RECREATE TRIGGER (CRITICAL)
-- Ensure trigger is properly attached
DROP TRIGGER IF EXISTS trigger_handle_rank_approval ON public.rank_requests;

-- 3. FIXED TRIGGER FUNCTION - Handle ELO values correctly with proper foreign key handling
CREATE OR REPLACE FUNCTION public.handle_rank_request_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_club_owner_id UUID;
  v_player_name TEXT;
  v_club_name TEXT;
  v_rank_text TEXT;
  v_elo_rank INTEGER;
BEGIN
  -- CRITICAL FIX: Get club OWNER's user_id, not club_id
  SELECT user_id INTO v_club_owner_id 
  FROM public.club_profiles 
  WHERE id = NEW.club_id;
  
  -- If no club owner found, try direct user_id (in case club_id IS the user_id)
  IF v_club_owner_id IS NULL THEN
    v_club_owner_id := NEW.club_id;
  END IF;
  
  -- CRITICAL FIX: Convert ELO values to SABO rank integers first
  -- Frontend sends ELO values (1000, 1100, 1200...), convert to 1-12
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
    ELSE 1  -- K (1000 and below)
  END;
  
  -- Convert integer to SABO rank text
  v_rank_text := CASE v_elo_rank
    WHEN 1 THEN 'K'
    WHEN 2 THEN 'K+'
    WHEN 3 THEN 'I'
    WHEN 4 THEN 'I+'
    WHEN 5 THEN 'H'
    WHEN 6 THEN 'H+'
    WHEN 7 THEN 'G'
    WHEN 8 THEN 'G+'
    WHEN 9 THEN 'F'
    WHEN 10 THEN 'F+'
    WHEN 11 THEN 'E'
    WHEN 12 THEN 'E+'
    ELSE 'K'
  END;
  
  -- Get club and player info for logging
  SELECT display_name INTO v_player_name FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT club_name INTO v_club_name FROM public.club_profiles WHERE id = NEW.club_id;
  
  -- Only process approved requests
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    BEGIN
      -- CRITICAL: Update profiles.verified_rank (main fix)
      UPDATE public.profiles 
      SET 
        verified_rank = v_rank_text,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
      
      -- Update player_rankings table
      INSERT INTO public.player_rankings (
        user_id,
        verified_rank,
        elo_points,
        verified_at,
        verified_by,
        club_verified,
        created_at,
        updated_at
      ) VALUES (
        NEW.user_id,
        v_rank_text,
        NEW.requested_rank,
        NOW(),
        v_club_owner_id,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        verified_rank = EXCLUDED.verified_rank,
        elo_points = EXCLUDED.elo_points,
        verified_at = EXCLUDED.verified_at,
        verified_by = EXCLUDED.verified_by,
        club_verified = EXCLUDED.club_verified,
        updated_at = NOW();
      
      -- CRITICAL: Create success notification
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
          'club_name', v_club_name,
          'approved_by', v_club_owner_id
        ),
        NOW()
      );
      
      -- Log success for debugging
      INSERT INTO public.error_logs (error_type, error_message, url, user_id, created_at)
      VALUES (
        'trigger_success',
        format('SABO rank approval SUCCESS: User %s (%s) → %s (%s ELO) by club %s', 
               NEW.user_id, v_player_name, v_rank_text, NEW.requested_rank, v_club_name),
        '/rank-verification',
        NEW.user_id,
        NOW()
      );
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Enhanced error logging
        INSERT INTO public.error_logs (error_type, error_message, url, user_id, created_at)
        VALUES (
          'trigger_error',
          format('SABO rank approval FAILED: %s. Request ID: %s, User: %s, ELO: %s, Converted Rank: %s', 
                 SQLERRM, NEW.id, NEW.user_id, NEW.requested_rank, v_rank_text),
          '/rank-verification',
          NEW.user_id,
          NOW()
        );
        -- Don't raise exception to prevent approval from failing
        RAISE WARNING 'SABO rank approval trigger failed: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE TRIGGER PROPERLY ATTACHED TO TABLE
CREATE TRIGGER trigger_handle_rank_approval
  AFTER UPDATE ON public.rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_rank_request_approval();

-- 5. FIX EXISTING DATA - Update profiles for already approved requests
DO $$
DECLARE
  v_request RECORD;
  v_rank_text TEXT;
  v_elo_rank INTEGER;
  v_club_owner_id UUID;
BEGIN
  -- Process all approved requests that haven't updated profiles yet
  FOR v_request IN 
    SELECT rr.*, p.verified_rank as current_verified_rank
    FROM public.rank_requests rr
    JOIN public.profiles p ON p.user_id = rr.user_id
    WHERE rr.status = 'approved' 
      AND p.verified_rank IS NULL
  LOOP
    -- Convert ELO to SABO rank
    v_elo_rank := CASE 
      WHEN v_request.requested_rank >= 2100 THEN 12  -- E+
      WHEN v_request.requested_rank >= 2000 THEN 11  -- E
      WHEN v_request.requested_rank >= 1900 THEN 10  -- F+
      WHEN v_request.requested_rank >= 1800 THEN 9   -- F
      WHEN v_request.requested_rank >= 1700 THEN 8   -- G+
      WHEN v_request.requested_rank >= 1600 THEN 7   -- G
      WHEN v_request.requested_rank >= 1500 THEN 6   -- H+
      WHEN v_request.requested_rank >= 1400 THEN 5   -- H
      WHEN v_request.requested_rank >= 1300 THEN 4   -- I+
      WHEN v_request.requested_rank >= 1200 THEN 3   -- I
      WHEN v_request.requested_rank >= 1100 THEN 2   -- K+
      ELSE 1  -- K
    END;
    
    v_rank_text := CASE v_elo_rank
      WHEN 1 THEN 'K'    WHEN 2 THEN 'K+'   WHEN 3 THEN 'I'    WHEN 4 THEN 'I+'
      WHEN 5 THEN 'H'    WHEN 6 THEN 'H+'   WHEN 7 THEN 'G'    WHEN 8 THEN 'G+'
      WHEN 9 THEN 'F'    WHEN 10 THEN 'F+'  WHEN 11 THEN 'E'   WHEN 12 THEN 'E+'
      ELSE 'K'
    END;
    
    -- Get club owner ID
    SELECT user_id INTO v_club_owner_id 
    FROM public.club_profiles 
    WHERE id = v_request.club_id;
    
    IF v_club_owner_id IS NULL THEN
      v_club_owner_id := v_request.club_id;
    END IF;
    
    -- Update profile
    UPDATE public.profiles 
    SET verified_rank = v_rank_text, updated_at = NOW()
    WHERE user_id = v_request.user_id;
    
    -- Update player_rankings
    INSERT INTO public.player_rankings (
      user_id, verified_rank, elo_points, verified_at, verified_by, club_verified, created_at, updated_at
    ) VALUES (
      v_request.user_id, v_rank_text, v_request.requested_rank, NOW(), v_club_owner_id, true, NOW(), NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      verified_rank = EXCLUDED.verified_rank,
      elo_points = EXCLUDED.elo_points,
      verified_at = EXCLUDED.verified_at,
      verified_by = EXCLUDED.verified_by,
      updated_at = NOW();
    
    RAISE NOTICE 'Fixed profile for user %: ELO % → SABO rank %', v_request.user_id, v_request.requested_rank, v_rank_text;
  END LOOP;
END;
$$;

-- 6. CREATE ELO-TO-SABO CONVERSION FUNCTION FOR FRONTEND
CREATE OR REPLACE FUNCTION public.elo_to_sabo_rank(elo_value INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN elo_value >= 2100 THEN 'E+'
    WHEN elo_value >= 2000 THEN 'E'
    WHEN elo_value >= 1900 THEN 'F+'
    WHEN elo_value >= 1800 THEN 'F'
    WHEN elo_value >= 1700 THEN 'G+'
    WHEN elo_value >= 1600 THEN 'G'
    WHEN elo_value >= 1500 THEN 'H+'
    WHEN elo_value >= 1400 THEN 'H'
    WHEN elo_value >= 1300 THEN 'I+'
    WHEN elo_value >= 1200 THEN 'I'
    WHEN elo_value >= 1100 THEN 'K+'
    ELSE 'K'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;