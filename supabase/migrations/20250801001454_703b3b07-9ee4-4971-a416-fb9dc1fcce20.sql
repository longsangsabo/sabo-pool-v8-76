-- Phase 1: Add automatic notifications for challenge acceptance

-- Create function to send challenge acceptance notifications
CREATE OR REPLACE FUNCTION public.send_challenge_acceptance_notifications()
RETURNS TRIGGER AS $$
DECLARE
  challenger_name TEXT;
  participant_name TEXT;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Get challenger and participant names
    SELECT display_name INTO challenger_name 
    FROM public.profiles 
    WHERE user_id = NEW.challenger_id;
    
    SELECT display_name INTO participant_name 
    FROM public.profiles 
    WHERE user_id = NEW.opponent_id;
    
    -- Send notification to challenger (challenge creator)
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    ) VALUES (
      NEW.challenger_id,
      'challenge_accepted',
      'Thách đấu được chấp nhận! 🎉',
      COALESCE(participant_name, 'Đối thủ') || ' đã chấp nhận thách đấu của bạn với ' || COALESCE(NEW.bet_points, 100) || ' SPA Points',
      jsonb_build_object(
        'challenge_id', NEW.id,
        'opponent_id', NEW.opponent_id,
        'opponent_name', participant_name,
        'bet_points', NEW.bet_points,
        'action_url', '/challenges'
      ),
      NOW()
    );
    
    -- Send notification to participant (person who accepted)
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    ) VALUES (
      NEW.opponent_id,
      'challenge_joined',
      'Tham gia thành công! ⚡',
      'Bạn đã tham gia thách đấu với ' || COALESCE(challenger_name, 'Đối thủ') || ' với cược ' || COALESCE(NEW.bet_points, 100) || ' SPA Points',
      jsonb_build_object(
        'challenge_id', NEW.id,
        'challenger_id', NEW.challenger_id,
        'challenger_name', challenger_name,
        'bet_points', NEW.bet_points,
        'action_url', '/challenges'
      ),
      NOW()
    );
    
    -- Log the notification creation
    RAISE NOTICE 'Challenge acceptance notifications sent for challenge %', NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for challenge acceptance notifications
DROP TRIGGER IF EXISTS trigger_challenge_acceptance_notifications ON public.challenges;
CREATE TRIGGER trigger_challenge_acceptance_notifications
  AFTER UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.send_challenge_acceptance_notifications();

-- Phase 2: Add automatic match creation when challenge is accepted
CREATE OR REPLACE FUNCTION public.create_match_from_accepted_challenge()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Create a match record for the accepted challenge
    INSERT INTO public.matches (
      player1_id,
      player2_id,
      challenge_id,
      match_type,
      status,
      created_at,
      scheduled_time
    ) VALUES (
      NEW.challenger_id,
      NEW.opponent_id,
      NEW.id,
      'challenge',
      'scheduled',
      NOW(),
      -- Schedule the match 2 hours from now by default
      NOW() + INTERVAL '2 hours'
    );
    
    RAISE NOTICE 'Match created for accepted challenge %', NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic match creation
DROP TRIGGER IF EXISTS trigger_create_match_from_challenge ON public.challenges;
CREATE TRIGGER trigger_create_match_from_challenge
  AFTER UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_from_accepted_challenge();

-- Phase 2: Enhanced challenge timeout automation
-- Drop existing function and recreate with proper return type
DROP FUNCTION IF EXISTS public.expire_old_challenges();

CREATE OR REPLACE FUNCTION public.expire_old_challenges()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Expire challenges that are past their expiry date
  UPDATE public.challenges 
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'pending' 
    AND expires_at < NOW();
    
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Expire accepted challenges that haven't had a match completed within 48 hours
  UPDATE public.challenges
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'accepted'
    AND responded_at < NOW() - INTERVAL '48 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.matches 
      WHERE challenge_id = challenges.id 
      AND status = 'completed'
    );
    
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add some helpful comments
COMMENT ON FUNCTION public.send_challenge_acceptance_notifications() IS 'Automatically sends notifications to both challenger and participant when a challenge is accepted';
COMMENT ON FUNCTION public.create_match_from_accepted_challenge() IS 'Automatically creates a match record when a challenge is accepted';
COMMENT ON FUNCTION public.expire_old_challenges() IS 'Expires old pending challenges and accepted challenges that havent been completed within 48 hours';