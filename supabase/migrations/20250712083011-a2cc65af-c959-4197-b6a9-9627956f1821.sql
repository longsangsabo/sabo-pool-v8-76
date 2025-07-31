-- Phase 4: Performance & Security

-- 1. Optimize RLS Policies - Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_admin, false) FROM profiles WHERE user_id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Improved RLS Policies with deleted profile filtering
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view active profiles"
ON profiles FOR SELECT
USING (deleted_at IS NULL AND is_visible = true);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin override policy (using security definer function)
CREATE POLICY "Admins can manage all profiles"
ON profiles FOR ALL
USING (is_current_user_admin());

-- 3. Profile Analytics and Tracking
CREATE TABLE IF NOT EXISTS profile_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for profile analytics
ALTER TABLE profile_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics"
ON profile_analytics FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "System can insert analytics"
ON profile_analytics FOR INSERT
WITH CHECK (true);

-- Function to track profile events
CREATE OR REPLACE FUNCTION track_profile_event(
  p_profile_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO profile_analytics (profile_id, event_type, event_data)
  VALUES (p_profile_id, p_event_type, p_event_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Profile Performance Tracking
CREATE OR REPLACE FUNCTION track_profile_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Track profile updates for performance analytics
  PERFORM track_profile_event(
    NEW.user_id,
    'profile_updated',
    jsonb_build_object(
      'completion_before', COALESCE(OLD.completion_percentage, 0),
      'completion_after', NEW.completion_percentage,
      'fields_updated', jsonb_build_object(
        'display_name', NEW.display_name IS DISTINCT FROM OLD.display_name,
        'avatar', NEW.avatar_url IS DISTINCT FROM OLD.avatar_url,
        'bio', NEW.bio IS DISTINCT FROM OLD.bio,
        'location', (NEW.city IS DISTINCT FROM OLD.city OR NEW.district IS DISTINCT FROM OLD.district)
      )
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for performance tracking
DROP TRIGGER IF EXISTS profile_performance_trigger ON profiles;
CREATE TRIGGER profile_performance_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION track_profile_performance();

-- 5. Profile Completion Rate View (for analytics)
CREATE OR REPLACE VIEW profile_completion_stats AS
SELECT 
  CASE 
    WHEN completion_percentage >= 90 THEN 'Complete (90%+)'
    WHEN completion_percentage >= 70 THEN 'Nearly Complete (70-89%)'
    WHEN completion_percentage >= 50 THEN 'Partial (50-69%)'
    WHEN completion_percentage >= 25 THEN 'Basic (25-49%)'
    ELSE 'Incomplete (<25%)'
  END as completion_level,
  COUNT(*) as user_count,
  ROUND(AVG(completion_percentage), 1) as avg_completion,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage_of_users
FROM profiles 
WHERE deleted_at IS NULL
GROUP BY 
  CASE 
    WHEN completion_percentage >= 90 THEN 'Complete (90%+)'
    WHEN completion_percentage >= 70 THEN 'Nearly Complete (70-89%)'
    WHEN completion_percentage >= 50 THEN 'Partial (50-69%)'
    WHEN completion_percentage >= 25 THEN 'Basic (25-49%)'
    ELSE 'Incomplete (<25%)'
  END
ORDER BY avg_completion DESC;