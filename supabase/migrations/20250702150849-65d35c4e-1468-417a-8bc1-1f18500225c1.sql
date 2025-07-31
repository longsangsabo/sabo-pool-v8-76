-- Create notifications table for real-time notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'challenge_received', 'challenge_accepted', 'challenge_rejected',
    'match_reminder', 'match_result_request',
    'rank_verification_approved', 'rank_verification_rejected',
    'trust_score_warning', 'penalty_received',
    'tournament_invite', 'club_invitation', 'system_update'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE NOT is_read;

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT,
  notification_action_url TEXT DEFAULT NULL,
  notification_metadata JSONB DEFAULT '{}',
  notification_priority TEXT DEFAULT 'normal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, message, action_url, metadata, priority
  )
  VALUES (
    target_user_id, notification_type, notification_title, 
    notification_message, notification_action_url, notification_metadata, notification_priority
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to notify challenge creation
CREATE OR REPLACE FUNCTION public.notify_challenge_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  challenger_name TEXT;
BEGIN
  -- Get challenger name
  SELECT full_name INTO challenger_name
  FROM public.profiles
  WHERE user_id = NEW.challenger_id;
  
  -- Create notification for the opponent
  PERFORM public.create_notification(
    NEW.opponent_id,
    'challenge_received',
    'Thách đấu mới',
    format('%s đã thách đấu bạn với mức cược %s điểm', 
           COALESCE(challenger_name, 'Ai đó'), 
           COALESCE(NEW.bet_points::TEXT, '0')),
    format('/challenges/%s', NEW.id),
    jsonb_build_object(
      'challenge_id', NEW.id,
      'challenger_id', NEW.challenger_id,
      'bet_points', NEW.bet_points
    ),
    'high'
  );
  
  RETURN NEW;
END;
$$;

-- Function to notify challenge response
CREATE OR REPLACE FUNCTION public.notify_challenge_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  opponent_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only notify on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get opponent name
  SELECT full_name INTO opponent_name
  FROM public.profiles
  WHERE user_id = NEW.opponent_id;
  
  -- Create notification based on status
  IF NEW.status = 'accepted' THEN
    notification_title := 'Thách đấu được chấp nhận';
    notification_message := format('%s đã chấp nhận thách đấu của bạn', 
                                   COALESCE(opponent_name, 'Đối thủ'));
  ELSIF NEW.status = 'rejected' THEN
    notification_title := 'Thách đấu bị từ chối';
    notification_message := format('%s đã từ chối thách đấu của bạn', 
                                   COALESCE(opponent_name, 'Đối thủ'));
  ELSE
    RETURN NEW;
  END IF;
  
  -- Create notification for the challenger
  PERFORM public.create_notification(
    NEW.challenger_id,
    format('challenge_%s', NEW.status),
    notification_title,
    notification_message,
    format('/challenges/%s', NEW.id),
    jsonb_build_object(
      'challenge_id', NEW.id,
      'opponent_id', NEW.opponent_id,
      'status', NEW.status
    ),
    'normal'
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_notify_challenge_created
AFTER INSERT ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.notify_challenge_created();

CREATE TRIGGER trigger_notify_challenge_response
AFTER UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.notify_challenge_response();

-- Enable realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.notifications;