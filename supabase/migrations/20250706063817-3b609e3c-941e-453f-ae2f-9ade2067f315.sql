-- Fix all remaining ambiguous column reference issues completely

-- Drop and recreate all functions that have ambiguous column references

-- 1. Fix notify_club_events function
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
  -- Get club owner ID and club name from club_profiles table specifically
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

-- 2. Fix notify_admin_new_registration function
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
  
  -- Get club name from the NEW record (club_registrations table)
  registration_club_name := NEW.club_name;
  
  -- Get user name from profiles table
  SELECT COALESCE(p.display_name, p.full_name, 'Người dùng') INTO user_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;
  
  -- Notify all admins
  FOR admin_user_id IN 
    SELECT p.user_id FROM public.profiles p WHERE p.is_admin = true
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

-- 3. Fix notify_admin_club_registration function  
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
  
  -- Get club name from the NEW record (club_registrations table)
  registration_club_name := NEW.club_name;
  
  -- Get user name from profiles table
  SELECT COALESCE(p.display_name, p.full_name, 'Người dùng') INTO user_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;
  
  -- Get all admin users and create notifications for them
  FOR admin_user_id IN 
    SELECT p.user_id FROM public.profiles p WHERE p.is_admin = true
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

-- 4. Also fix the update_club_stats function to avoid any potential ambiguity
CREATE OR REPLACE FUNCTION public.update_club_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  club_id_var UUID;
  current_month INTEGER;
  current_year INTEGER;
BEGIN
  -- Get club ID from the triggering table
  IF TG_TABLE_NAME = 'rank_verifications' THEN
    club_id_var := COALESCE(NEW.club_id, OLD.club_id);
  ELSIF TG_TABLE_NAME = 'matches' THEN
    club_id_var := COALESCE(NEW.club_id, OLD.club_id);
  ELSIF TG_TABLE_NAME = 'tournaments' THEN
    club_id_var := COALESCE(NEW.club_id, OLD.club_id);
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF club_id_var IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Update or insert club stats
  INSERT INTO public.club_stats (
    club_id, 
    month, 
    year,
    verified_members,
    total_matches_hosted,
    active_members
  )
  VALUES (
    club_id_var,
    current_month,
    current_year,
    (SELECT COUNT(*) FROM public.rank_verifications rv WHERE rv.club_id = club_id_var AND rv.status = 'approved'),
    (SELECT COUNT(*) FROM public.matches m WHERE m.club_id = club_id_var AND EXTRACT(MONTH FROM m.created_at) = current_month),
    (SELECT COUNT(DISTINCT rv2.player_id) FROM public.rank_verifications rv2 WHERE rv2.club_id = club_id_var AND rv2.status = 'approved')
  )
  ON CONFLICT (club_id, month, year) 
  DO UPDATE SET
    verified_members = (SELECT COUNT(*) FROM public.rank_verifications rv3 WHERE rv3.club_id = club_id_var AND rv3.status = 'approved'),
    total_matches_hosted = (SELECT COUNT(*) FROM public.matches m2 WHERE m2.club_id = club_id_var AND EXTRACT(MONTH FROM m2.created_at) = current_month),
    active_members = (SELECT COUNT(DISTINCT rv4.player_id) FROM public.rank_verifications rv4 WHERE rv4.club_id = club_id_var AND rv4.status = 'approved'),
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$function$;