-- SABO Pool Arena Rank System - CORRECTED for existing schema
-- Fix the incorrect amateur/pro system with proper SABO ranks

-- 1. Add missing indexes for performance (CORRECTED)
CREATE INDEX IF NOT EXISTS idx_rank_requests_club_id_status ON public.rank_requests(club_id, status);
CREATE INDEX IF NOT EXISTS idx_rank_requests_user_id ON public.rank_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_verifications_user_club ON public.rank_verifications(user_id, club_id);
-- Skip verified_rank index since column doesn't exist

-- 2. Add unique constraint to prevent duplicate requests (CORRECT)
ALTER TABLE public.rank_requests 
ADD CONSTRAINT unique_active_rank_request 
EXCLUDE (user_id WITH =, club_id WITH =) 
WHERE (status IN ('pending', 'approved'));

-- 3. Helper function to compare SABO rank order (needed first)
CREATE OR REPLACE FUNCTION public.get_rank_order(rank_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE rank_text
    WHEN 'K' THEN 1
    WHEN 'K+' THEN 2
    WHEN 'I' THEN 3
    WHEN 'I+' THEN 4
    WHEN 'H' THEN 5
    WHEN 'H+' THEN 6
    WHEN 'G' THEN 7
    WHEN 'G+' THEN 8
    WHEN 'F' THEN 9
    WHEN 'F+' THEN 10
    WHEN 'E' THEN 11
    WHEN 'E+' THEN 12
    ELSE 0 -- Unknown rank
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Function to convert integer to SABO rank
CREATE OR REPLACE FUNCTION public.integer_to_sabo_rank(rank_int INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE rank_int
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
    ELSE 'K' -- Default to lowest rank
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Function to convert SABO rank to integer (reverse mapping)
CREATE OR REPLACE FUNCTION public.sabo_rank_to_integer(rank_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN get_rank_order(rank_text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. FIXED TRIGGER FUNCTION with CORRECT SABO RANK SYSTEM
CREATE OR REPLACE FUNCTION public.handle_rank_request_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_club_id UUID;
  v_player_name TEXT;
  v_club_name TEXT;
  v_rank_text TEXT;
BEGIN
  -- CORRECT SABO RANK CONVERSION: 1-12 → K to E+
  v_rank_text := integer_to_sabo_rank(NEW.requested_rank);
  
  -- Get club_id and player info
  SELECT user_id INTO v_club_id FROM public.profiles WHERE user_id = NEW.club_id;
  SELECT full_name INTO v_player_name FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT club_name INTO v_club_name FROM public.club_profiles WHERE user_id = NEW.club_id;
  
  -- Only process approved requests
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    BEGIN
      -- Insert or update rank verification record
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
        NEW.club_notes,
        NOW(),
        NEW.club_id, -- Club ID that verified
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

      -- Update player rankings (use existing columns)
      UPDATE public.player_rankings 
      SET 
        verified_at = NOW(),
        verified_by = NEW.club_id,
        club_verified = true,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
      
      -- Update profiles current_rank with SABO rank
      UPDATE public.profiles 
      SET 
        current_rank = v_rank_text,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
      
      -- Create success notification in Vietnamese
      INSERT INTO public.notifications (user_id, type, title, message, priority, metadata)
      VALUES (
        NEW.user_id,
        'rank_approved',
        'Hạng đã được xác thực',
        format('Hạng %s của bạn đã được CLB "%s" xác thực thành công!', v_rank_text, COALESCE(v_club_name, 'Unknown')),
        'high',
        jsonb_build_object(
          'rank', v_rank_text,
          'club_name', v_club_name,
          'approved_by', NEW.club_id
        )
      );
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error for debugging
        INSERT INTO public.error_logs (error_type, error_message, url, user_id)
        VALUES (
          'trigger_error',
          format('SABO rank approval trigger failed: %s. Request ID: %s, User: %s, Rank: %s', SQLERRM, NEW.id, NEW.user_id, v_rank_text),
          '/rank-verification',
          NEW.user_id
        );
        RAISE WARNING 'SABO rank approval trigger failed: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fixed batch approval function with SABO ranks
CREATE OR REPLACE FUNCTION public.batch_approve_rank_requests(
  p_request_ids UUID[],
  p_club_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors TEXT[] := '{}';
  v_request_id UUID;
BEGIN
  -- Validate club ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.club_profiles 
    WHERE user_id = p_club_id AND verification_status = 'approved'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Không có quyền: CLB không hợp lệ'
    );
  END IF;
  
  -- Process each request
  FOREACH v_request_id IN ARRAY p_request_ids
  LOOP
    BEGIN
      UPDATE public.rank_requests 
      SET 
        status = 'approved',
        club_notes = COALESCE(p_notes, club_notes),
        approved_by = p_club_id,
        updated_at = NOW()
      WHERE id = v_request_id 
        AND club_id = p_club_id 
        AND status = 'pending';
        
      IF FOUND THEN
        v_success_count := v_success_count + 1;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        v_errors := array_append(v_errors, format('Yêu cầu %s: %s', v_request_id, SQLERRM));
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'processed', array_length(p_request_ids, 1),
    'approved', v_success_count,
    'errors', v_error_count,
    'error_details', v_errors
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;