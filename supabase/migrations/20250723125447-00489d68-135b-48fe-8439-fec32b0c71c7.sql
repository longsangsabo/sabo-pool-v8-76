-- 🚨 CRITICAL: FIX MISSING RLS POLICIES FOR RANK_REQUESTS

-- Drop existing policies để recreate properly
DROP POLICY IF EXISTS "Users can create their own rank requests" ON public.rank_requests;
DROP POLICY IF EXISTS "Users can view their own rank requests" ON public.rank_requests;

-- Create comprehensive RLS policies for rank_requests
CREATE POLICY "Users can create rank requests"
ON public.rank_requests FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own rank requests"
ON public.rank_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Club owners can view rank requests for their club"
ON public.rank_requests FOR SELECT
TO authenticated
USING (
  club_id IN (
    SELECT id FROM public.club_profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Club owners can update rank requests for their club"
ON public.rank_requests FOR UPDATE
TO authenticated
USING (
  club_id IN (
    SELECT id FROM public.club_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Create trigger for automatic notifications when rank request is created
CREATE OR REPLACE FUNCTION public.handle_new_rank_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_club_owner_id UUID;
  v_player_name TEXT;
  v_club_name TEXT;
BEGIN
  -- Get club owner and info
  SELECT cp.user_id, cp.club_name INTO v_club_owner_id, v_club_name
  FROM public.club_profiles cp
  WHERE cp.id = NEW.club_id;

  -- Get player name
  SELECT COALESCE(p.full_name, p.display_name, 'Người chơi') INTO v_player_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;

  -- Create notification for club owner
  IF v_club_owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      priority,
      action_url,
      auto_popup
    ) VALUES (
      v_club_owner_id,
      'Yêu cầu xác thực hạng mới',
      format('Có yêu cầu xác thực hạng %s từ %s tại CLB %s', 
             NEW.requested_rank, 
             v_player_name,
             v_club_name),
      'rank_request',
      'high',
      '/club-dashboard?tab=rank-verification',
      true
    );
  END IF;

  -- Send realtime notification
  PERFORM pg_notify(
    'rank_request_created',
    json_build_object(
      'club_id', NEW.club_id,
      'request_id', NEW.id,
      'user_name', v_player_name,
      'requested_rank', NEW.requested_rank,
      'created_at', NEW.created_at
    )::text
  );

  RETURN NEW;
END;
$$;

-- Create trigger for rank request status updates
CREATE OR REPLACE FUNCTION public.handle_rank_request_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_player_name TEXT;
  v_club_name TEXT;
  v_status_text TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get player and club names
  SELECT COALESCE(p.full_name, p.display_name, 'Bạn') INTO v_player_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;

  SELECT cp.club_name INTO v_club_name
  FROM public.club_profiles cp
  WHERE cp.id = NEW.club_id;

  -- Determine status text
  CASE NEW.status
    WHEN 'approved' THEN v_status_text := 'đã được phê duyệt';
    WHEN 'rejected' THEN v_status_text := 'đã bị từ chối';
    ELSE v_status_text := 'đã được cập nhật';
  END CASE;

  -- Create notification for user
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    priority,
    action_url,
    auto_popup
  ) VALUES (
    NEW.user_id,
    'Kết quả xác thực hạng',
    format('Yêu cầu xác thực hạng %s tại CLB %s %s', 
           NEW.requested_rank,
           v_club_name,
           v_status_text),
    'rank_result',
    'high',
    '/profile?tab=ranking',
    true
  );

  -- Update user's verified rank if approved
  IF NEW.status = 'approved' THEN
    UPDATE public.profiles 
    SET verified_rank = NEW.requested_rank,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

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

  RETURN NEW;
END;
$$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS rank_request_created_trigger ON public.rank_requests;
DROP TRIGGER IF EXISTS rank_request_updated_trigger ON public.rank_requests;

-- Create triggers
CREATE TRIGGER rank_request_created_trigger
  AFTER INSERT ON public.rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_rank_request();

CREATE TRIGGER rank_request_updated_trigger
  AFTER UPDATE ON public.rank_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_rank_request_status_update();

-- Ensure realtime is enabled for rank_requests
ALTER TABLE public.rank_requests REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.rank_requests;