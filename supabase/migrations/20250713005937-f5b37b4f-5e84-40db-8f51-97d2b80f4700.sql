-- Fix trigger function to use correct column name
CREATE OR REPLACE FUNCTION public.handle_rank_request_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_club_id UUID;
  v_player_name TEXT;
  v_club_name TEXT;
BEGIN
  -- Get club_id and player name from the request
  SELECT user_id INTO v_club_id FROM public.profiles WHERE user_id = NEW.club_id;
  SELECT full_name INTO v_player_name FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT club_name INTO v_club_name FROM public.club_profiles WHERE user_id = NEW.club_id;
  
  -- Only process approved requests
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
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
      NEW.requested_rank,
      NEW.requested_rank,  -- Set verified_rank to requested_rank when approved
      'approved',
      NEW.club_notes,      -- Use club_notes instead of notes
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

    -- Update player rankings with verified rank
    UPDATE public.player_rankings 
    SET 
      verified_rank = NEW.requested_rank,
      verified_at = NOW(),
      verified_by = NEW.club_id,
      club_verified = true,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Create success notification
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;