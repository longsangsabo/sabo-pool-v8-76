-- Fix profile update permissions - ensure users can update their own profiles
-- Update RLS policy to be more permissive for profile updates
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also ensure users can insert their own profile if it doesn't exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create notification function for club registration approval
CREATE OR REPLACE FUNCTION public.notify_club_registration_status()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  club_name TEXT;
BEGIN
  -- Only notify on status change from pending to approved/rejected
  IF OLD.status = NEW.status OR OLD.status != 'pending' THEN
    RETURN NEW;
  END IF;
  
  -- Get club name for notification
  club_name := NEW.club_name;
  
  -- Create notification based on status
  IF NEW.status = 'approved' THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'club_registration_approved',
      'Đăng ký CLB được duyệt',
      format('Chúc mừng! Đăng ký CLB "%s" của bạn đã được duyệt', club_name),
      '/profile?tab=club-registration',
      jsonb_build_object(
        'registration_id', NEW.id,
        'club_name', club_name
      ),
      'high'
    );
  ELSIF NEW.status = 'rejected' THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'club_registration_rejected',
      'Đăng ký CLB bị từ chối',
      format('Đăng ký CLB "%s" của bạn đã bị từ chối. Lý do: %s', 
             club_name, 
             COALESCE(NEW.rejection_reason, 'Không có lý do cụ thể')),
      '/profile?tab=club-registration',
      jsonb_build_object(
        'registration_id', NEW.id,
        'club_name', club_name,
        'rejection_reason', NEW.rejection_reason
      ),
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for club registration status changes
DROP TRIGGER IF EXISTS club_registration_status_change ON public.club_registrations;
CREATE TRIGGER club_registration_status_change
  AFTER UPDATE ON public.club_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_club_registration_status();