-- Create trigger to notify admin when new club registration is submitted
CREATE OR REPLACE FUNCTION public.notify_admin_club_registration()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
  club_name TEXT;
  user_name TEXT;
BEGIN
  -- Only notify when status changes to pending (new registration or resubmission)
  IF NEW.status != 'pending' OR (OLD IS NOT NULL AND OLD.status = NEW.status) THEN
    RETURN NEW;
  END IF;
  
  -- Get club name and user name
  club_name := NEW.club_name;
  
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
             COALESCE(user_name, 'Người dùng'), club_name),
      '/admin/clubs',
      jsonb_build_object(
        'registration_id', NEW.id,
        'club_name', club_name,
        'user_id', NEW.user_id
      ),
      'high'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for club registration notifications
DROP TRIGGER IF EXISTS notify_admin_club_registration_trigger ON public.club_registrations;
CREATE TRIGGER notify_admin_club_registration_trigger
  AFTER INSERT OR UPDATE ON public.club_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_club_registration();