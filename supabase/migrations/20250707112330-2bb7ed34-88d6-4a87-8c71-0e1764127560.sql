-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Channel preferences
  in_app BOOLEAN DEFAULT true,
  sms BOOLEAN DEFAULT false,
  email BOOLEAN DEFAULT true,
  zalo BOOLEAN DEFAULT false,
  push_notification BOOLEAN DEFAULT true,
  
  -- Notification level preferences
  tournament_level TEXT DEFAULT 'high' CHECK (tournament_level IN ('high', 'medium', 'low', 'off')),
  challenge_level TEXT DEFAULT 'medium' CHECK (challenge_level IN ('high', 'medium', 'low', 'off')),
  ranking_level TEXT DEFAULT 'medium' CHECK (ranking_level IN ('high', 'medium', 'low', 'off')),
  match_level TEXT DEFAULT 'high' CHECK (match_level IN ('high', 'medium', 'low', 'off')),
  social_level TEXT DEFAULT 'low' CHECK (social_level IN ('high', 'medium', 'low', 'off')),
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_start_time TIME DEFAULT '22:00:00',
  quiet_end_time TIME DEFAULT '07:00:00',
  
  -- Timezone
  timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Create notification logs table
CREATE TABLE public.notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification details
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT NOT NULL CHECK (category IN ('tournament', 'challenge', 'ranking', 'match', 'social', 'system')),
  
  -- Delivery channels
  channels_sent JSONB DEFAULT '[]'::jsonb,
  channels_failed JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  action_url TEXT,
  
  -- Timestamps
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notification templates table
CREATE TABLE public.notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Template details
  template_key TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tournament', 'challenge', 'ranking', 'match', 'social', 'system')),
  
  -- Content templates
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  sms_template TEXT,
  email_template TEXT,
  
  -- Settings
  default_priority TEXT DEFAULT 'normal' CHECK (default_priority IN ('low', 'normal', 'high', 'urgent')),
  supported_channels JSONB DEFAULT '["in_app", "email", "sms", "push"]'::jsonb,
  
  -- Localization
  locale TEXT DEFAULT 'vi',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user communication channels table
CREATE TABLE public.user_communication_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Channel details
  channel_type TEXT NOT NULL CHECK (channel_type IN ('sms', 'email', 'zalo', 'push')),
  channel_address TEXT NOT NULL, -- phone number, email, zalo ID, push token
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  verification_expires_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, channel_type, channel_address)
);

-- Create indexes for performance
CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX idx_notification_logs_category ON public.notification_logs(category);
CREATE INDEX idx_notification_logs_created_at ON public.notification_logs(created_at DESC);
CREATE INDEX idx_user_communication_channels_user_id ON public.user_communication_channels(user_id);
CREATE INDEX idx_notification_templates_category ON public.notification_templates(category);

-- Enable RLS on all tables
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_communication_channels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences"
ON public.notification_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notification_logs
CREATE POLICY "Users can view their own notification logs"
ON public.notification_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notification logs"
ON public.notification_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notification read status"
ON public.notification_logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notification_templates
CREATE POLICY "Everyone can view active notification templates"
ON public.notification_templates
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- RLS Policies for user_communication_channels
CREATE POLICY "Users can manage their own communication channels"
ON public.user_communication_channels
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to create default notification preferences
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to create default preferences when profile is created
CREATE TRIGGER trigger_create_default_notification_preferences
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_default_notification_preferences();