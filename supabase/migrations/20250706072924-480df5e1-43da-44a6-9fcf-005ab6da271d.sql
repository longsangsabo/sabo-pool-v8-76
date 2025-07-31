-- Fix the ambiguous column reference in notify_club_events function
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
$function$