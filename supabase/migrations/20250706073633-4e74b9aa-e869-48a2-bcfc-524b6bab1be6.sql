-- Fix any remaining ambiguous column references in database functions
-- Let's also check the notify_admin_new_registration function

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
  
  -- Get club name from the NEW record (club_registrations table) - specify which table
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
$function$