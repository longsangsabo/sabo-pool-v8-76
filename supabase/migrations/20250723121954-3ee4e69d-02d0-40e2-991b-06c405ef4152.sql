-- Enable realtime for rank_requests table
ALTER TABLE public.rank_requests REPLICA IDENTITY FULL;

-- Add rank_requests table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.rank_requests;

-- Create trigger function to send notifications when rank request is created
CREATE OR REPLACE FUNCTION public.notify_club_on_rank_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for club owner
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    priority,
    action_url,
    auto_popup
  )
  SELECT 
    cp.user_id,
    'Yêu cầu xác thực hạng mới',
    format('Có yêu cầu xác thực hạng %s từ %s tại CLB %s', 
           NEW.requested_rank, 
           COALESCE(p.full_name, p.display_name, 'Người chơi'),
           cp.club_name),
    'rank_request',
    'high',
    '/club-dashboard?tab=rank-verification',
    true
  FROM public.club_profiles cp
  LEFT JOIN public.profiles p ON NEW.user_id = p.user_id
  WHERE cp.id = NEW.club_id;
  
  -- Send realtime notification
  PERFORM pg_notify(
    'rank_request_created',
    json_build_object(
      'club_id', NEW.club_id,
      'request_id', NEW.id,
      'user_name', (SELECT COALESCE(full_name, display_name) FROM profiles WHERE user_id = NEW.user_id),
      'requested_rank', NEW.requested_rank,
      'created_at', NEW.created_at
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new rank requests
CREATE OR REPLACE TRIGGER trigger_notify_club_on_rank_request
  AFTER INSERT ON public.rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_club_on_rank_request();

-- Create trigger function for rank request status updates
CREATE OR REPLACE FUNCTION public.notify_user_on_rank_status_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changed
  IF OLD.status != NEW.status THEN
    -- Create notification for the user who made the request
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      priority,
      action_url,
      auto_popup
    )
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Yêu cầu xác thực hạng được phê duyệt'
        WHEN NEW.status = 'rejected' THEN 'Yêu cầu xác thực hạng bị từ chối'
        ELSE 'Cập nhật yêu cầu xác thực hạng'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN format('Chúc mừng! Hạng %s của bạn đã được phê duyệt tại CLB %s', 
                                                 NEW.requested_rank,
                                                 (SELECT club_name FROM club_profiles WHERE id = NEW.club_id))
        WHEN NEW.status = 'rejected' THEN format('Yêu cầu xác thực hạng %s tại CLB %s đã bị từ chối. %s', 
                                                 NEW.requested_rank,
                                                 (SELECT club_name FROM club_profiles WHERE id = NEW.club_id),
                                                 COALESCE('Lý do: ' || NEW.rejection_reason, ''))
        ELSE 'Trạng thái yêu cầu xác thực hạng đã được cập nhật'
      END,
      'rank_request_update',
      CASE WHEN NEW.status = 'approved' THEN 'high' ELSE 'normal' END,
      '/profile?tab=achievements',
      CASE WHEN NEW.status = 'approved' THEN true ELSE false END
    );
    
    -- Send realtime notification
    PERFORM pg_notify(
      'rank_request_updated',
      json_build_object(
        'request_id', NEW.id,
        'user_id', NEW.user_id,
        'status', NEW.status,
        'requested_rank', NEW.requested_rank,
        'updated_at', NEW.updated_at
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for rank request status updates
CREATE OR REPLACE TRIGGER trigger_notify_user_on_rank_status_update
  AFTER UPDATE ON public.rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_on_rank_status_update();