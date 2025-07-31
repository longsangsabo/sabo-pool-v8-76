-- Fix ambiguous column reference by updating the notify_club_events function
CREATE OR REPLACE FUNCTION public.notify_club_events()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$  
DECLARE
  club_owner_id UUID;
  notification_title TEXT;
  notification_message TEXT;
  club_name_value TEXT;
BEGIN
  -- Get club owner ID and club name
  SELECT cp.user_id, cp.club_name INTO club_owner_id, club_name_value
  FROM public.club_profiles cp
  WHERE cp.id = COALESCE(NEW.club_id, OLD.club_id);

  IF club_owner_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Create notifications based on trigger
  IF TG_TABLE_NAME = 'rank_verifications' AND TG_OP = 'INSERT' THEN
    notification_title := 'Yêu cầu xác thực hạng mới';
    notification_message := format('Có yêu cầu xác thực hạng %s cần được xử lý', NEW.requested_rank);
    
    PERFORM public.create_notification(
      club_owner_id,
      'rank_verification_request',
      notification_title,
      notification_message,
      format('/club-management?tab=rank-verification&request=%s', NEW.id),
      jsonb_build_object('request_id', NEW.id, 'rank', NEW.requested_rank),
      'high'
    );
    
  ELSIF TG_TABLE_NAME = 'matches' AND TG_OP = 'INSERT' THEN
    notification_title := 'Trận đấu mới tại CLB';
    notification_message := format('Có trận đấu mới được tổ chức tại câu lạc bộ %s', COALESCE(club_name_value, 'của bạn'));
    
    PERFORM public.create_notification(
      club_owner_id,
      'new_match',
      notification_title,
      notification_message,
      '/club-management?tab=overview',
      jsonb_build_object('match_id', NEW.id),
      'normal'
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix the notify_admin_new_registration function as well
CREATE OR REPLACE FUNCTION public.notify_admin_new_registration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  admin_user_id UUID;
  user_name TEXT;
  registration_club_name TEXT;
BEGIN
  -- Only notify on new pending registrations
  IF NEW.status != 'pending' OR (OLD IS NOT NULL AND OLD.status = NEW.status) THEN
    RETURN NEW;
  END IF;
  
  -- Get club name from registrations table specifically
  registration_club_name := NEW.club_name;
  
  -- Get user name
  SELECT COALESCE(display_name, full_name, 'Người dùng') INTO user_name
  FROM public.profiles 
  WHERE user_id = NEW.user_id;
  
  -- Notify all admins
  FOR admin_user_id IN 
    SELECT user_id FROM public.profiles WHERE is_admin = true
  LOOP
    PERFORM public.create_notification(
      admin_user_id,
      'club_registration_pending',
      'Đăng ký CLB mới',
      format('%s đã gửi đăng ký CLB "%s". Vui lòng xem xét và phê duyệt.', 
        COALESCE(user_name, 'Người dùng'), registration_club_name),
      '/admin/clubs',
      jsonb_build_object(
        'registration_id', NEW.id,
        'club_name', registration_club_name,
        'user_id', NEW.user_id
      ),
      'high'
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Fix the notify_admin_club_registration function
CREATE OR REPLACE FUNCTION public.notify_admin_club_registration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  admin_user_id UUID;
  registration_club_name TEXT;
  user_name TEXT;
BEGIN
  -- Only notify when status changes to pending (new registration or resubmission)
  IF NEW.status != 'pending' OR (OLD IS NOT NULL AND OLD.status = NEW.status) THEN
    RETURN NEW;
  END IF;
  
  -- Get club name from the registration record
  registration_club_name := NEW.club_name;
  
  -- Get user name from profiles
  SELECT COALESCE(display_name, full_name, 'Người dùng') INTO user_name
  FROM public.profiles 
  WHERE user_id = NEW.user_id;
  
  -- Get all admin users and create notifications for them
  FOR admin_user_id IN 
    SELECT user_id FROM public.profiles WHERE is_admin = true
  LOOP
    -- Create notification for admin
    PERFORM public.create_notification(
      admin_user_id,
      'club_registration_pending',
      'Đăng ký CLB mới',
      format('%s đã gửi đăng ký CLB "%s". Vui lòng xem xét và phê duyệt.', 
             COALESCE(user_name, 'Người dùng'), registration_club_name),
      '/admin/clubs',
      jsonb_build_object(
        'registration_id', NEW.id,
        'club_name', registration_club_name,
        'user_id', NEW.user_id
      ),
      'high'
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;