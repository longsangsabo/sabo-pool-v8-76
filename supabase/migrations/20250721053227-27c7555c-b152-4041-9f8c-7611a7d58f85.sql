-- FIX: Update profiles.verified_rank manually for user SABO PRO TEAM
-- Since the trigger failed due to missing current_rank column

-- 1. Update the user's verified_rank to G (the latest approved rank)
UPDATE public.profiles 
SET 
  verified_rank = 'G',
  rank_verified_at = NOW(),
  updated_at = NOW()
WHERE user_id = 'b183caef-3ec8-4d3b-9d6a-d0ca4c14be72';

-- 2. Fix the trigger function to not reference non-existent columns
CREATE OR REPLACE FUNCTION public.handle_rank_request_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_club_id UUID;
  v_player_name TEXT;
  v_club_name TEXT;
  v_rank_text TEXT;
  v_elo_rank INTEGER;
BEGIN
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
  
  -- CRITICAL FIX: Handle both ELO values AND rank integers
  -- If requested_rank is small (1-12), treat as rank integer, else as ELO
  IF NEW.requested_rank <= 12 THEN
    -- It's already a rank integer (1-12)
    v_elo_rank := NEW.requested_rank;
  END IF;
  
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
  SELECT user_id INTO v_club_id FROM public.profiles WHERE user_id = NEW.club_id;
  SELECT full_name INTO v_player_name FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT club_name INTO v_club_name FROM public.club_profiles WHERE user_id = NEW.club_id;
  
  -- Only process approved requests
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    BEGIN
      -- CRITICAL: Insert/Update rank verification with UNIQUE constraint
      INSERT INTO public.rank_verifications (
        user_id,
        club_id,
        requested_rank,
        verified_rank,
        status,
        verification_notes,
        verified_at,
        verified_by,
        created_at,
        updated_at
      ) VALUES (
        NEW.user_id,
        NEW.club_id,
        v_rank_text,
        v_rank_text,
        'approved',
        'Auto-approved via trigger',
        NOW(),
        NEW.club_id,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, club_id) 
      DO UPDATE SET
        requested_rank = EXCLUDED.requested_rank,
        verified_rank = EXCLUDED.verified_rank,
        status = EXCLUDED.status,
        verification_notes = EXCLUDED.verification_notes,
        verified_at = EXCLUDED.verified_at,
        verified_by = EXCLUDED.verified_by,
        updated_at = NOW();

      -- CRITICAL FIX: Update ONLY verified_rank in profiles (no current_rank)
      UPDATE public.profiles 
      SET 
        verified_rank = v_rank_text,
        rank_verified_at = NOW(),
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
      
      -- Update player_rankings table if exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_rankings') THEN
        INSERT INTO public.player_rankings (
          user_id,
          verified_rank,
          verified_at,
          verified_by,
          club_verified,
          created_at,
          updated_at
        ) VALUES (
          NEW.user_id,
          v_rank_text,
          NOW(),
          NEW.club_id,
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
          verified_rank = EXCLUDED.verified_rank,
          verified_at = EXCLUDED.verified_at,
          verified_by = EXCLUDED.verified_by,
          club_verified = EXCLUDED.club_verified,
          updated_at = NOW();
      END IF;
      
      -- CRITICAL: Create success notification
      INSERT INTO public.notifications (user_id, type, title, message, priority, metadata, created_at)
      VALUES (
        NEW.user_id,
        'rank_approved',
        'Hạng đã được xác thực',
        format('Hạng %s của bạn đã được CLB "%s" xác thực thành công!', v_rank_text, COALESCE(v_club_name, 'Unknown')),
        'high',
        jsonb_build_object(
          'rank', v_rank_text,
          'rank_integer', v_elo_rank,
          'club_name', v_club_name,
          'approved_by', NEW.club_id
        ),
        NOW()
      );
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Enhanced error logging
        RAISE WARNING 'SABO rank approval trigger failed: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;