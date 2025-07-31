-- Fix trigger function by removing ON CONFLICT and using manual checks
CREATE OR REPLACE FUNCTION public.handle_rank_request_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_club_id UUID;
  v_player_name TEXT;
  v_club_name TEXT;
  v_existing_verification_id UUID;
BEGIN
  -- Get club_id and player name from the request
  SELECT user_id INTO v_club_id FROM public.profiles WHERE user_id = NEW.club_id;
  SELECT full_name INTO v_player_name FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT club_name INTO v_club_name FROM public.club_profiles WHERE user_id = NEW.club_id;
  
  -- Only process approved requests
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Check if verification already exists for this user and club
    SELECT id INTO v_existing_verification_id 
    FROM public.rank_verifications 
    WHERE user_id = NEW.user_id AND club_id = NEW.club_id;
    
    IF v_existing_verification_id IS NOT NULL THEN
      -- Update existing verification
      UPDATE public.rank_verifications 
      SET 
        requested_rank = NEW.requested_rank,
        verified_rank = NEW.requested_rank,
        status = 'approved',
        verification_notes = NEW.club_notes,
        verified_at = NOW(),
        verified_by = NEW.club_id,
        updated_at = NOW()
      WHERE id = v_existing_verification_id;
    ELSE
      -- Insert new verification record
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
        NEW.requested_rank,
        NEW.requested_rank,
        'approved',
        NEW.club_notes,
        NOW(),
        NEW.club_id,
        NOW(),
        NOW()
      );
    END IF;

    -- Update player rankings with verified rank - check if record exists first
    IF EXISTS (SELECT 1 FROM public.player_rankings WHERE user_id = NEW.user_id) THEN
      UPDATE public.player_rankings 
      SET 
        verified_rank = NEW.requested_rank,
        verified_at = NOW(),
        verified_by = NEW.club_id,
        club_verified = true,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSE
      -- Insert if player_rankings record doesn't exist
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
        NEW.requested_rank,
        NOW(),
        NEW.club_id,
        true,
        NOW(),
        NOW()
      );
    END IF;
    
    -- Create success notification - check if notifications table exists
    BEGIN
      INSERT INTO public.notifications (user_id, type, title, message, priority, metadata)
      VALUES (
        NEW.user_id,
        'rank_approved',
        'Hạng đã được xác thực',
        format('Hạng %s của bạn đã được CLB "%s" xác thực thành công!', NEW.requested_rank, COALESCE(v_club_name, 'Unknown')),
        'high',
        jsonb_build_object(
          'rank', NEW.requested_rank,
          'club_name', v_club_name,
          'approved_by', NEW.club_id
        )
      );
    EXCEPTION
      WHEN undefined_table THEN
        -- Notifications table doesn't exist, skip notification
        NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;