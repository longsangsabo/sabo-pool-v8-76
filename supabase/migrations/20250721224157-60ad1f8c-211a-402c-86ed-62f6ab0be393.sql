
-- Create Analytics & Monitoring Tables
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  session_id TEXT,
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  context JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.api_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.web_vitals_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  page_url TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.openai_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  model_id TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  request_type TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System Management Tables
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  source TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.automation_performance_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_type TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tournament Advanced Tables
CREATE TABLE public.tournament_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  tier_level INTEGER NOT NULL UNIQUE,
  points_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  qualification_required BOOLEAN NOT NULL DEFAULT false,
  min_participants INTEGER NOT NULL DEFAULT 8,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.elo_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_type TEXT NOT NULL,
  condition_key TEXT NOT NULL,
  points_base INTEGER NOT NULL DEFAULT 0,
  points_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  tier_level INTEGER,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.player_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_matches INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  win_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_win_streak INTEGER NOT NULL DEFAULT 0,
  tournaments_played INTEGER NOT NULL DEFAULT 0,
  tournaments_won INTEGER NOT NULL DEFAULT 0,
  spa_points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE public.player_trust_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trust_score NUMERIC(3,2) NOT NULL DEFAULT 0,
  trust_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Social Features Tables
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

CREATE TABLE public.mutual_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_entity_id UUID NOT NULL,
  rated_entity_type TEXT NOT NULL CHECK (rated_entity_type IN ('user', 'club', 'tournament')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rater_id, rated_entity_id, rated_entity_type)
);

CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  match_type TEXT NOT NULL DEFAULT 'casual',
  score_player1 INTEGER DEFAULT 0,
  score_player2 INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.match_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  elo_before INTEGER NOT NULL DEFAULT 1000,
  elo_after INTEGER NOT NULL DEFAULT 1000,
  elo_change INTEGER NOT NULL DEFAULT 0,
  spa_points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, player_id)
);

-- Add missing columns to challenges table
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS bet_points INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS race_to INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS handicap_1_rank TEXT,
ADD COLUMN IF NOT EXISTS handicap_05_rank TEXT,
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days');

-- Enable RLS on all new tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_vitals_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.openai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_performance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elo_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutual_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Analytics events - users can only see their own
CREATE POLICY "Users can view their own analytics events" 
ON public.analytics_events FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics events" 
ON public.analytics_events FOR INSERT 
WITH CHECK (true);

-- Performance metrics - admins only
CREATE POLICY "Admins can view performance metrics" 
ON public.performance_metrics FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "System can insert performance metrics" 
ON public.performance_metrics FOR INSERT 
WITH CHECK (true);

-- API performance metrics - admins only
CREATE POLICY "Admins can view API performance metrics" 
ON public.api_performance_metrics FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "System can insert API performance metrics" 
ON public.api_performance_metrics FOR INSERT 
WITH CHECK (true);

-- Web vitals - users can see their own
CREATE POLICY "Users can view their own web vitals" 
ON public.web_vitals_metrics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert web vitals" 
ON public.web_vitals_metrics FOR INSERT 
WITH CHECK (true);

-- OpenAI usage logs - users can see their own, admins see all
CREATE POLICY "Users can view their own OpenAI usage" 
ON public.openai_usage_logs FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "System can insert OpenAI usage logs" 
ON public.openai_usage_logs FOR INSERT 
WITH CHECK (true);

-- System logs - admins only
CREATE POLICY "Admins can view system logs" 
ON public.system_logs FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "System can insert system logs" 
ON public.system_logs FOR INSERT 
WITH CHECK (true);

-- Admin actions - admins only
CREATE POLICY "Admins can view admin actions" 
ON public.admin_actions FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can insert admin actions" 
ON public.admin_actions FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Automation performance log - admins only
CREATE POLICY "Admins can view automation performance" 
ON public.automation_performance_log FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "System can insert automation performance" 
ON public.automation_performance_log FOR INSERT 
WITH CHECK (true);

-- Tournament tiers - public read, admin write
CREATE POLICY "Anyone can view tournament tiers" 
ON public.tournament_tiers FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage tournament tiers" 
ON public.tournament_tiers FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- ELO rules - public read, admin write
CREATE POLICY "Anyone can view active ELO rules" 
ON public.elo_rules FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage ELO rules" 
ON public.elo_rules FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Player stats - public read, system write
CREATE POLICY "Anyone can view player stats" 
ON public.player_stats FOR SELECT 
USING (true);

CREATE POLICY "System can manage player stats" 
ON public.player_stats FOR ALL 
WITH CHECK (true);

-- Player trust scores - public read, system write
CREATE POLICY "Anyone can view player trust scores" 
ON public.player_trust_scores FOR SELECT 
USING (true);

CREATE POLICY "System can manage player trust scores" 
ON public.player_trust_scores FOR ALL 
WITH CHECK (true);

-- User follows - users can manage their own follows
CREATE POLICY "Users can view follows" 
ON public.user_follows FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own follows" 
ON public.user_follows FOR ALL 
USING (auth.uid() = follower_id)
WITH CHECK (auth.uid() = follower_id);

-- Mutual ratings - users can rate others, view all ratings
CREATE POLICY "Anyone can view ratings" 
ON public.mutual_ratings FOR SELECT 
USING (true);

CREATE POLICY "Users can create ratings" 
ON public.mutual_ratings FOR INSERT 
WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Users can update their own ratings" 
ON public.mutual_ratings FOR UPDATE 
USING (auth.uid() = rater_id);

-- Matches - public read, participants can write
CREATE POLICY "Anyone can view matches" 
ON public.matches FOR SELECT 
USING (true);

CREATE POLICY "Players can manage their matches" 
ON public.matches FOR ALL 
USING (auth.uid() = player1_id OR auth.uid() = player2_id)
WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Match results - public read, system write
CREATE POLICY "Anyone can view match results" 
ON public.match_results FOR SELECT 
USING (true);

CREATE POLICY "System can manage match results" 
ON public.match_results FOR ALL 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON public.performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON public.performance_metrics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_api_performance_endpoint ON public.api_performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_performance_created_at ON public.api_performance_metrics(created_at);

CREATE INDEX IF NOT EXISTS idx_openai_usage_user_id ON public.openai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_openai_usage_model_id ON public.openai_usage_logs(model_id);
CREATE INDEX IF NOT EXISTS idx_openai_usage_created_at ON public.openai_usage_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);

CREATE INDEX IF NOT EXISTS idx_tournament_tiers_tier_level ON public.tournament_tiers(tier_level);

CREATE INDEX IF NOT EXISTS idx_elo_rules_rule_type ON public.elo_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_elo_rules_is_active ON public.elo_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON public.player_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_player_trust_scores_user_id ON public.player_trust_scores(user_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON public.user_follows(following_id);

CREATE INDEX IF NOT EXISTS idx_mutual_ratings_rater_id ON public.mutual_ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_mutual_ratings_rated_entity ON public.mutual_ratings(rated_entity_id, rated_entity_type);

CREATE INDEX IF NOT EXISTS idx_matches_player1_id ON public.matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2_id ON public.matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON public.match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_player_id ON public.match_results(player_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_tournament_tiers_updated_at
  BEFORE UPDATE ON public.tournament_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_elo_rules_updated_at
  BEFORE UPDATE ON public.elo_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON public.player_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_trust_scores_updated_at
  BEFORE UPDATE ON public.player_trust_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mutual_ratings_updated_at
  BEFORE UPDATE ON public.mutual_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tournament tiers
INSERT INTO public.tournament_tiers (tier_name, tier_level, points_multiplier, qualification_required, min_participants, description) VALUES
('Beginner', 1, 1.0, false, 8, 'Entry-level tournaments for new players'),
('Intermediate', 2, 1.2, false, 8, 'Mid-level tournaments for improving players'),
('Advanced', 3, 1.5, true, 8, 'High-level tournaments requiring qualification'),
('Expert', 4, 2.0, true, 8, 'Elite tournaments for top players'),
('Championship', 5, 3.0, true, 16, 'Premier championship events');

-- Insert default ELO rules
INSERT INTO public.elo_rules (rule_type, condition_key, points_base, points_multiplier, description, is_active) VALUES
('tournament_position', '1st', 100, 1.0, 'First place in tournament', true),
('tournament_position', '2nd', 70, 1.0, 'Second place in tournament', true),
('tournament_position', '3rd', 50, 1.0, 'Third place in tournament', true),
('tournament_position', '4th', 30, 1.0, 'Fourth place in tournament', true),
('tournament_position', 'top_8', 20, 1.0, 'Top 8 finish in tournament', true),
('tournament_position', 'participation', 10, 1.0, 'Tournament participation', true),
('challenge_win', 'standard', 15, 1.0, 'Winning a challenge match', true),
('challenge_loss', 'standard', -10, 1.0, 'Losing a challenge match', true);

-- Create missing database functions
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'normal',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, message, priority
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_priority
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_bulk_notifications(
  p_user_ids UUID[],
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  notification_count INTEGER := 0;
BEGIN
  FOREACH user_id IN ARRAY p_user_ids
  LOOP
    INSERT INTO public.notifications (
      user_id, type, title, message, priority
    ) VALUES (
      user_id, p_type, p_title, p_message, p_priority
    );
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_demo_users(
  p_count INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demo_count INTEGER := 0;
BEGIN
  -- This is a placeholder function for demo user seeding
  -- In a real implementation, this would create demo users
  RETURN jsonb_build_object(
    'success', true,
    'demo_users_created', demo_count,
    'message', 'Demo user seeding is disabled for security'
  );
END;
$$;
