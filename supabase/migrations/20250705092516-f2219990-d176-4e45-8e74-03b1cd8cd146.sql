-- Phase 1: Database Functions & Triggers for Club Registration System (Fixed)

-- 1. Create approval logs table for audit trail
CREATE TABLE IF NOT EXISTS public.approval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.club_registrations(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on approval_logs
ALTER TABLE public.approval_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for approval_logs
CREATE POLICY "Admins can view approval logs" 
ON public.approval_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

CREATE POLICY "System can insert approval logs" 
ON public.approval_logs FOR INSERT
WITH CHECK (true);

-- 2. Create comprehensive approval function
CREATE OR REPLACE FUNCTION public.approve_club_registration(
  registration_id UUID,
  approver_id UUID,
  approved BOOLEAN,
  comments TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  registration_record RECORD;
  result JSON;
BEGIN
  -- Get registration details
  SELECT * INTO registration_record 
  FROM public.club_registrations 
  WHERE id = registration_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Registration not found or already processed');
  END IF;
  
  -- Update registration status
  UPDATE public.club_registrations 
  SET 
    status = CASE WHEN approved THEN 'approved' ELSE 'rejected' END,
    approved_by = approver_id,
    approved_at = now(),
    rejection_reason = CASE WHEN NOT approved THEN comments ELSE NULL END,
    updated_at = now()
  WHERE id = registration_id;
  
  -- Log the approval action
  INSERT INTO public.approval_logs (registration_id, approver_id, action, comments)
  VALUES (
    registration_id, 
    approver_id, 
    CASE WHEN approved THEN 'approved' ELSE 'rejected' END, 
    comments
  );
  
  -- If approved, create club profile and update user role
  IF approved THEN
    -- Create club profile
    INSERT INTO public.club_profiles (
      user_id, 
      club_name, 
      address, 
      phone, 
      operating_hours,
      number_of_tables,
      verification_status,
      verified_at,
      verified_by
    ) VALUES (
      registration_record.user_id,
      registration_record.club_name,
      registration_record.address,
      registration_record.phone,
      jsonb_build_object(
        'open', registration_record.opening_time,
        'close', registration_record.closing_time,
        'days', ARRAY['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      ),
      registration_record.table_count,
      'approved',
      now(),
      approver_id
    )
    ON CONFLICT (user_id) DO UPDATE SET
      club_name = EXCLUDED.club_name,
      address = EXCLUDED.address,
      phone = EXCLUDED.phone,
      operating_hours = EXCLUDED.operating_hours,
      number_of_tables = EXCLUDED.number_of_tables,
      verification_status = 'approved',
      verified_at = now(),
      verified_by = approver_id,
      updated_at = now();
    
    -- Update user role to club_owner
    UPDATE public.profiles 
    SET 
      role = 'both',
      active_role = 'club_owner',
      updated_at = now()
    WHERE user_id = registration_record.user_id;
    
    -- Create success notification
    PERFORM public.create_notification(
      registration_record.user_id,
      'club_approved',
      'CLB được phê duyệt',
      format('Chúc mừng! Câu lạc bộ "%s" của bạn đã được phê duyệt thành công.', registration_record.club_name),
      '/profile?tab=club',
      jsonb_build_object(
        'club_name', registration_record.club_name,
        'registration_id', registration_id
      ),
      'high'
    );
  ELSE
    -- Create rejection notification
    PERFORM public.create_notification(
      registration_record.user_id,
      'club_rejected',
      'CLB bị từ chối',
      format('Đăng ký câu lạc bộ "%s" đã bị từ chối. Lý do: %s', 
        registration_record.club_name, 
        COALESCE(comments, 'Không có lý do cụ thể')),
      '/profile?tab=club-registration',
      jsonb_build_object(
        'club_name', registration_record.club_name,
        'registration_id', registration_id,
        'rejection_reason', comments
      ),
      'normal'
    );
  END IF;
  
  -- Return success result
  RETURN json_build_object(
    'success', true, 
    'registration_id', registration_id,
    'new_status', CASE WHEN approved THEN 'approved' ELSE 'rejected' END,
    'club_name', registration_record.club_name
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return failure
    RAISE WARNING 'Error in approve_club_registration: %', SQLERRM;
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 3. Create performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_club_registrations_status_created 
ON public.club_registrations(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_club_registrations_pending 
ON public.club_registrations(created_at DESC) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_club_registrations_user_status 
ON public.club_registrations(user_id, status);

CREATE INDEX IF NOT EXISTS idx_approval_logs_registration_created 
ON public.approval_logs(registration_id, created_at DESC);

-- 4. Fix existing trigger cleanup (proper order)
DROP TRIGGER IF EXISTS club_registration_status_change ON public.club_registrations;
DROP FUNCTION IF EXISTS public.notify_club_registration_status() CASCADE;

-- Create new optimized trigger for admin notifications on new registrations
CREATE OR REPLACE FUNCTION public.notify_admin_new_registration()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
  user_name TEXT;
BEGIN
  -- Only notify on new pending registrations
  IF NEW.status != 'pending' OR (OLD IS NOT NULL AND OLD.status = NEW.status) THEN
    RETURN NEW;
  END IF;
  
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
        COALESCE(user_name, 'Người dùng'), NEW.club_name),
      '/admin/clubs',
      jsonb_build_object(
        'registration_id', NEW.id,
        'club_name', NEW.club_name,
        'user_id', NEW.user_id
      ),
      'high'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_club_registration
  AFTER INSERT ON public.club_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_registration();