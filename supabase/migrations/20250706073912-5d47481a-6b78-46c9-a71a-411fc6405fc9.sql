-- Final fix for any remaining functions that might have ambiguous references
-- Let's also make sure the notify_admin_club_registration function is properly fixed

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
  
  -- Get club name from the NEW record (club_registrations table) - use explicit reference
  registration_club_name := NEW.club_name;
  
  -- Get user name from profiles table with explicit table reference
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
$function$