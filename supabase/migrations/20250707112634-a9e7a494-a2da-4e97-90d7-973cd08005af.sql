-- Insert default notification templates
INSERT INTO public.notification_templates (template_key, category, title_template, message_template, sms_template, email_template, default_priority, supported_channels) VALUES
-- Tournament notifications
('tournament_new', 'tournament', 'Giải đấu mới: {{tournament_name}}', '{{tournament_name}} đang mở đăng ký. Phí tham gia: {{entry_fee}}. Thời hạn: {{registration_deadline}}', 'Giải {{tournament_name}} mở đăng ký! Phí: {{entry_fee}}. Đăng ký ngay!', 'Giải đấu mới {{tournament_name}} đã được tạo...', 'high', '["in_app", "email", "sms", "push"]'),

('tournament_registration_confirmed', 'tournament', 'Đăng ký thành công: {{tournament_name}}', 'Bạn đã đăng ký thành công giải đấu {{tournament_name}}. Ngày thi đấu: {{tournament_date}}', 'Đăng ký {{tournament_name}} thành công! Ngày: {{tournament_date}}', 'Chào {{player_name}}, bạn đã đăng ký thành công...', 'high', '["in_app", "email", "sms", "push"]'),

('tournament_starting_soon', 'tournament', 'Giải đấu sắp bắt đầu', 'Giải đấu {{tournament_name}} sẽ bắt đầu trong {{time_remaining}}. Vị trí: {{venue}}', 'Giải {{tournament_name}} bắt đầu trong {{time_remaining}}!', 'Giải đấu {{tournament_name}} sắp bắt đầu...', 'urgent', '["in_app", "sms", "push"]'),

-- Challenge notifications  
('challenge_received', 'challenge', 'Thách đấu mới từ {{challenger_name}}', '{{challenger_name}} thách đấu bạn {{challenge_details}}. Tiền cược: {{stake_amount}}', '{{challenger_name}} thách đấu bạn! Cược: {{stake_amount}}', 'Bạn nhận được thách đấu từ {{challenger_name}}...', 'high', '["in_app", "sms", "push"]'),

('challenge_accepted', 'challenge', 'Thách đấu được chấp nhận', '{{opponent_name}} đã chấp nhận thách đấu của bạn. Thời gian: {{match_time}}', '{{opponent_name}} chấp nhận thách đấu! Thời gian: {{match_time}}', '{{opponent_name}} đã chấp nhận thách đấu của bạn...', 'high', '["in_app", "sms", "push"]'),

('challenge_expired', 'challenge', 'Thách đấu đã hết hạn', 'Thách đấu với {{opponent_name}} đã hết hạn do không được phản hồi', 'Thách đấu với {{opponent_name}} đã hết hạn', 'Thách đấu của bạn đã hết hạn...', 'normal', '["in_app"]'),

-- Match notifications
('match_result_confirmed', 'match', 'Kết quả trận đấu đã xác nhận', 'Kết quả trận với {{opponent_name}}: {{result}}. ELO thay đổi: {{elo_change}}', 'Trận với {{opponent_name}}: {{result}}. ELO: {{elo_change}}', 'Kết quả trận đấu của bạn đã được xác nhận...', 'high', '["in_app", "sms", "push"]'),

('match_disputed', 'match', 'Kết quả trận đấu bị khiếu nại', 'Kết quả trận đấu với {{opponent_name}} đang được xem xét khiếu nại', 'Trận với {{opponent_name}} bị khiếu nại', 'Có khiếu nại về kết quả trận đấu...', 'high', '["in_app", "email"]'),

-- Ranking notifications
('rank_promotion', 'ranking', 'Chúc mừng thăng hạng!', 'Bạn đã thăng từ hạng {{old_rank}} lên {{new_rank}}. SPA points: {{spa_points}}', 'Chúc mừng thăng hạng {{new_rank}}!', 'Chúc mừng bạn đã thăng hạng...', 'high', '["in_app", "email", "sms", "push"]'),

('rank_demotion', 'ranking', 'Thông báo giáng hạng', 'Bạn đã giáng từ hạng {{old_rank}} xuống {{new_rank}}. Cần cải thiện phong độ!', 'Giáng hạng xuống {{new_rank}}', 'Thông báo về việc giáng hạng...', 'normal', '["in_app", "email"]'),

('spa_points_milestone', 'ranking', 'Đạt mốc SPA Points', 'Chúc mừng! Bạn đã đạt {{milestone}} SPA Points. Tiếp tục phấn đấu!', 'Đạt {{milestone}} SPA Points!', 'Chúc mừng milestone SPA Points...', 'normal', '["in_app", "push"]'),

-- Social notifications
('new_follower', 'social', 'Người theo dõi mới', '{{follower_name}} đã theo dõi bạn', '{{follower_name}} theo dõi bạn', '{{follower_name}} đã theo dõi tài khoản của bạn...', 'low', '["in_app"]'),

('post_liked', 'social', 'Bài viết được thích', '{{liker_name}} đã thích bài viết của bạn', '{{liker_name}} thích bài viết', '{{liker_name}} đã thích bài viết của bạn...', 'low', '["in_app"]'),

-- System notifications
('maintenance_scheduled', 'system', 'Bảo trì hệ thống', 'Hệ thống sẽ bảo trì từ {{start_time}} đến {{end_time}}', 'Bảo trì hệ thống {{start_time}} - {{end_time}}', 'Thông báo bảo trì hệ thống...', 'urgent', '["in_app", "email", "sms"]'),

('system_update', 'system', 'Cập nhật hệ thống', 'Hệ thống đã được cập nhật với tính năng mới: {{features}}', 'Cập nhật mới: {{features}}', 'Hệ thống vừa được cập nhật...', 'normal', '["in_app", "email"]');

-- Create enhanced notification service functions
CREATE OR REPLACE FUNCTION public.send_enhanced_notification(
  p_user_id UUID,
  p_template_key TEXT,
  p_variables JSONB DEFAULT '{}'::jsonb,
  p_override_priority TEXT DEFAULT NULL,
  p_scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
  v_template RECORD;
  v_preferences RECORD;
  v_final_title TEXT;
  v_final_message TEXT;
  v_final_priority TEXT;
  v_var_key TEXT;
  v_var_value TEXT;
BEGIN
  -- Get notification template
  SELECT * INTO v_template 
  FROM public.notification_templates 
  WHERE template_key = p_template_key AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found: %', p_template_key;
  END IF;
  
  -- Get user preferences
  SELECT * INTO v_preferences 
  FROM public.notification_preferences 
  WHERE user_id = p_user_id;
  
  -- Create default preferences if not exists
  IF NOT FOUND THEN
    INSERT INTO public.notification_preferences (user_id) 
    VALUES (p_user_id) 
    RETURNING * INTO v_preferences;
  END IF;
  
  -- Check if category is enabled for user
  CASE v_template.category
    WHEN 'tournament' THEN 
      IF v_preferences.tournament_level = 'off' THEN RETURN NULL; END IF;
    WHEN 'challenge' THEN 
      IF v_preferences.challenge_level = 'off' THEN RETURN NULL; END IF;
    WHEN 'ranking' THEN 
      IF v_preferences.ranking_level = 'off' THEN RETURN NULL; END IF;
    WHEN 'match' THEN 
      IF v_preferences.match_level = 'off' THEN RETURN NULL; END IF;
    WHEN 'social' THEN 
      IF v_preferences.social_level = 'off' THEN RETURN NULL; END IF;
  END CASE;
  
  -- Process template variables
  v_final_title := v_template.title_template;
  v_final_message := v_template.message_template;
  
  -- Replace variables in template
  FOR v_var_key, v_var_value IN SELECT key, value FROM jsonb_each_text(p_variables)
  LOOP
    v_final_title := REPLACE(v_final_title, '{{' || v_var_key || '}}', v_var_value);
    v_final_message := REPLACE(v_final_message, '{{' || v_var_key || '}}', v_var_value);
  END LOOP;
  
  -- Determine final priority
  v_final_priority := COALESCE(p_override_priority, v_template.default_priority);
  
  -- Create notification log
  INSERT INTO public.notification_logs (
    user_id, type, title, message, priority, category, 
    metadata, scheduled_at, status
  ) VALUES (
    p_user_id, p_template_key, v_final_title, v_final_message, 
    v_final_priority, v_template.category, p_variables, p_scheduled_at, 'pending'
  ) RETURNING id INTO v_notification_id;
  
  -- Also create in-app notification for backward compatibility
  INSERT INTO public.notifications (
    user_id, type, title, message, priority, metadata
  ) VALUES (
    p_user_id, p_template_key, v_final_title, v_final_message, 
    v_final_priority, p_variables
  );
  
  RETURN v_notification_id;
END;
$$;

-- Function to get notification statistics
CREATE OR REPLACE FUNCTION public.get_notification_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_notifications', COUNT(*),
    'unread_count', COUNT(*) FILTER (WHERE read_at IS NULL),
    'by_category', jsonb_object_agg(
      category, 
      jsonb_build_object(
        'total', category_count,
        'unread', category_unread
      )
    )
  ) INTO v_stats
  FROM (
    SELECT 
      category,
      COUNT(*) as category_count,
      COUNT(*) FILTER (WHERE read_at IS NULL) as category_unread
    FROM public.notification_logs
    WHERE user_id = p_user_id
      AND created_at >= now() - INTERVAL '30 days'
    GROUP BY category
  ) stats;
  
  RETURN COALESCE(v_stats, '{}'::jsonb);
END;
$$;