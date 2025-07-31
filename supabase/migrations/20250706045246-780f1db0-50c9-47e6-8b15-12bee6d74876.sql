-- Create function to notify club when rank verification request is created
CREATE OR REPLACE FUNCTION public.notify_rank_verification_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  player_name TEXT;
  club_name TEXT;
  club_owner_id UUID;
  admin_user_id UUID;
BEGIN
  -- Only notify on new requests
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Get player name
    SELECT COALESCE(full_name, nickname, 'Người chơi') INTO player_name
    FROM public.profiles 
    WHERE user_id = NEW.player_id;
    
    -- Get club info and owner
    SELECT cp.club_name, cp.user_id INTO club_name, club_owner_id
    FROM public.club_profiles cp
    WHERE cp.id = NEW.club_id;
    
    -- Create notification for club owner
    IF club_owner_id IS NOT NULL THEN
      PERFORM public.create_notification(
        club_owner_id,
        'rank_verification_request',
        'Yêu cầu xác thực hạng mới',
        format('%s đã gửi yêu cầu xác thực hạng %s tại câu lạc bộ của bạn. Vui lòng kiểm tra và xử lý.',
               COALESCE(player_name, 'Người chơi'), NEW.requested_rank),
        '/admin/rank-requests',
        jsonb_build_object(
          'request_id', NEW.id,
          'player_id', NEW.player_id,
          'player_name', player_name,
          'requested_rank', NEW.requested_rank,
          'club_name', club_name
        ),
        'high'
      );
    END IF;
    
    -- Also notify all admins
    FOR admin_user_id IN 
      SELECT user_id FROM public.profiles WHERE is_admin = true
    LOOP
      PERFORM public.create_notification(
        admin_user_id,
        'rank_verification_request_admin',
        'Yêu cầu xác thực hạng mới',
        format('%s đã gửi yêu cầu xác thực hạng %s tại %s.',
               COALESCE(player_name, 'Người chơi'), 
               NEW.requested_rank,
               COALESCE(club_name, 'CLB')),
        '/admin/rank-requests',
        jsonb_build_object(
          'request_id', NEW.id,
          'player_id', NEW.player_id,
          'player_name', player_name,
          'requested_rank', NEW.requested_rank,
          'club_name', club_name
        ),
        'normal'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for rank verification requests
DROP TRIGGER IF EXISTS notify_rank_verification_request_trigger ON public.rank_verifications;
CREATE TRIGGER notify_rank_verification_request_trigger
  AFTER INSERT ON public.rank_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_rank_verification_request();

-- Also create function to notify when status changes (approved/rejected)
CREATE OR REPLACE FUNCTION public.notify_rank_verification_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  player_name TEXT;
  club_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only notify on status changes (not on initial insert)
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status != 'pending' THEN
    -- Get player name
    SELECT COALESCE(full_name, nickname, 'Bạn') INTO player_name
    FROM public.profiles 
    WHERE user_id = NEW.player_id;
    
    -- Get club name
    SELECT club_name INTO club_name
    FROM public.club_profiles
    WHERE id = NEW.club_id;
    
    -- Set notification content based on status
    CASE NEW.status
      WHEN 'approved' THEN
        notification_title := 'Yêu cầu xác thực hạng được chấp nhận! 🎉';
        notification_message := format('Chúc mừng! Yêu cầu xác thực hạng %s của bạn tại %s đã được chấp nhận.',
          NEW.requested_rank, COALESCE(club_name, 'câu lạc bộ'));
      WHEN 'rejected' THEN
        notification_title := 'Yêu cầu xác thực hạng bị từ chối';
        notification_message := format('Yêu cầu xác thực hạng %s của bạn tại %s đã bị từ chối. %s',
          NEW.requested_rank, 
          COALESCE(club_name, 'câu lạc bộ'),
          CASE WHEN NEW.rejection_reason IS NOT NULL THEN format('Lý do: %s', NEW.rejection_reason) ELSE '' END);
      WHEN 'on_site_test' THEN
        notification_title := 'Yêu cầu kiểm tra tại chỗ';
        notification_message := format('Vui lòng đến %s để thực hiện bài kiểm tra xác thực hạng %s.',
          COALESCE(club_name, 'câu lạc bộ'), NEW.requested_rank);
      ELSE
        RETURN NEW; -- Don't notify for other statuses
    END CASE;
    
    -- Create notification for player
    PERFORM public.create_notification(
      NEW.player_id,
      format('rank_verification_%s', NEW.status),
      notification_title,
      notification_message,
      '/profile?tab=ranking',
      jsonb_build_object(
        'request_id', NEW.id,
        'requested_rank', NEW.requested_rank,
        'club_name', club_name,
        'status', NEW.status,
        'rejection_reason', NEW.rejection_reason
      ),
      CASE WHEN NEW.status = 'approved' THEN 'high' ELSE 'normal' END
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS notify_rank_verification_status_change_trigger ON public.rank_verifications;
CREATE TRIGGER notify_rank_verification_status_change_trigger
  AFTER UPDATE ON public.rank_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_rank_verification_status_change();