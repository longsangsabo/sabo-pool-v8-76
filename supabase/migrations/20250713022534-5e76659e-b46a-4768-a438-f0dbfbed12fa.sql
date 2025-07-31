-- COMPLETE RANK VERIFICATION DISPLAY FIX
-- Fix foreign key constraint violation in trigger

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
  
  -- Convert ELO values to SABO rank integers (FIXED LOGIC)
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
    WHEN 1 THEN 'K'    WHEN 2 THEN 'K+'   WHEN 3 THEN 'I'    WHEN 4 THEN 'I+'
    WHEN 5 THEN 'H'    WHEN 6 THEN 'H+'   WHEN 7 THEN 'G'    WHEN 8 THEN 'G+'
    WHEN 9 THEN 'F'    WHEN 10 THEN 'F+'  WHEN 11 THEN 'E'   WHEN 12 THEN 'E+'
    ELSE 'K'
  END;
  
  -- Get names for logging
  SELECT display_name INTO v_player_name FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT club_name INTO v_club_name FROM public.club_profiles WHERE id = NEW.club_id;
  
  -- Only process approved requests
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    BEGIN
      -- CRITICAL: Update profiles.verified_rank
      UPDATE public.profiles 
      SET 
        verified_rank = v_rank_text,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
      
      -- Update/Insert player_rankings
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
      
      -- Create success notification
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
      
      -- Log success
      INSERT INTO public.error_logs (error_type, error_message, url, user_id, created_at)
      VALUES (
        'trigger_success',
        format('RANK APPROVAL SUCCESS: User %s (%s) → %s (%s ELO) by club %s', 
               NEW.user_id, v_player_name, v_rank_text, NEW.requested_rank, v_club_name),
        '/rank-verification',
        NEW.user_id,
        NOW()
      );
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Detailed error logging
        INSERT INTO public.error_logs (error_type, error_message, url, user_id, created_at)
        VALUES (
          'trigger_error',
          format('RANK APPROVAL FAILED: %s | User: %s | ELO: %s | SABO: %s | Club: %s | ClubOwner: %s', 
                 SQLERRM, NEW.user_id, NEW.requested_rank, v_rank_text, NEW.club_id, v_club_owner_id),
          '/rank-verification',
          NEW.user_id,
          NOW()
        );
        RAISE WARNING 'Rank approval trigger failed: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE ELO-TO-SABO CONVERSION FUNCTION FOR FRONTEND
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