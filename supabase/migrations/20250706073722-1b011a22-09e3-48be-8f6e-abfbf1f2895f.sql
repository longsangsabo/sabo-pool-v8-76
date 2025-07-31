-- Fix the approve_club_registration function to avoid any ambiguous references
CREATE OR REPLACE FUNCTION public.approve_club_registration(registration_id uuid, approver_id uuid, approved boolean, comments text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  registration_record RECORD;
  result JSON;
BEGIN
  -- Get registration details with explicit column references
  SELECT cr.* INTO registration_record 
  FROM public.club_registrations cr
  WHERE cr.id = registration_id AND cr.status = 'pending';
  
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
    -- Create club profile with explicit references
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
$function$