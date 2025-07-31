-- TASK 2: Create Security Definer Functions for Admin RLS
-- Fix infinite recursion issues in admin policies

-- 1. Create security definer function to check admin status safely
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Create function to check specific admin roles  
CREATE OR REPLACE FUNCTION public.has_admin_role(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND (is_admin = true OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Drop existing problematic admin policies
DROP POLICY IF EXISTS "Admins can manage admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can manage their own chat sessions" ON public.admin_chat_sessions;
DROP POLICY IF EXISTS "Admins can manage messages in their sessions" ON public.admin_chat_messages;
DROP POLICY IF EXISTS "Admins can manage knowledge base" ON public.admin_knowledge_base;
DROP POLICY IF EXISTS "Admins can manage workflows" ON public.admin_workflows;
DROP POLICY IF EXISTS "Admins can view all AI usage statistics" ON public.ai_usage_statistics;
DROP POLICY IF EXISTS "Admins can view all events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view all API metrics" ON public.api_performance_metrics;
DROP POLICY IF EXISTS "Admins can view approval logs" ON public.approval_logs;
DROP POLICY IF EXISTS "Admins can view automation performance" ON public.automation_performance_log;
DROP POLICY IF EXISTS "Admins can update club registrations" ON public.club_registrations;
DROP POLICY IF EXISTS "Admins can view all club registrations" ON public.club_registrations;
DROP POLICY IF EXISTS "Admins can manage ELO rules" ON public.elo_calculation_rules;
DROP POLICY IF EXISTS "Admins can manage ELO rules" ON public.elo_rules;
DROP POLICY IF EXISTS "Admins can view all errors" ON public.error_logs;
DROP POLICY IF EXISTS "Admins can manage game configurations" ON public.game_configurations;
DROP POLICY IF EXISTS "Admins can view config logs" ON public.game_config_logs;
DROP POLICY IF EXISTS "Admins can manage all disputes" ON public.match_disputes;
DROP POLICY IF EXISTS "Admins can manage tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admins can manage tournament registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.profiles;

-- 4. Recreate admin policies using security definer functions
CREATE POLICY "Admins can manage admin actions" 
ON public.admin_actions FOR ALL 
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can manage their own chat sessions" 
ON public.admin_chat_sessions FOR ALL 
TO authenticated
USING (public.is_current_user_admin() AND admin_id = auth.uid())
WITH CHECK (public.is_current_user_admin() AND admin_id = auth.uid());

CREATE POLICY "Admins can manage messages in their sessions" 
ON public.admin_chat_messages FOR ALL 
TO authenticated
USING (public.is_current_user_admin() AND EXISTS (
  SELECT 1 FROM admin_chat_sessions s 
  WHERE s.id = admin_chat_messages.session_id AND s.admin_id = auth.uid()
))
WITH CHECK (public.is_current_user_admin() AND EXISTS (
  SELECT 1 FROM admin_chat_sessions s 
  WHERE s.id = admin_chat_messages.session_id AND s.admin_id = auth.uid()
));

CREATE POLICY "Admins can manage knowledge base" 
ON public.admin_knowledge_base FOR ALL 
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can manage workflows" 
ON public.admin_workflows FOR ALL 
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can view all AI usage statistics" 
ON public.ai_usage_statistics FOR SELECT 
TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY "Admins can view all events" 
ON public.analytics_events FOR SELECT 
TO authenticated
USING (public.is_current_user_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can view all API metrics" 
ON public.api_performance_metrics FOR SELECT 
TO authenticated
USING (public.is_current_user_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can view approval logs" 
ON public.approval_logs FOR SELECT 
TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY "Admins can view automation performance" 
ON public.automation_performance_log FOR SELECT 
TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY "Admins can update club registrations" 
ON public.club_registrations FOR UPDATE 
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can view all club registrations" 
ON public.club_registrations FOR SELECT 
TO authenticated
USING (public.is_current_user_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can manage ELO calculation rules" 
ON public.elo_calculation_rules FOR ALL 
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can manage ELO rules" 
ON public.elo_rules FOR ALL 
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can view all errors" 
ON public.error_logs FOR SELECT 
TO authenticated
USING (public.is_current_user_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can manage game configurations" 
ON public.game_configurations FOR ALL 
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can view config logs" 
ON public.game_config_logs FOR SELECT 
TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage all disputes" 
ON public.match_disputes FOR ALL 
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can manage tournaments" 
ON public.tournaments FOR ALL 
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can manage tournament registrations" 
ON public.tournament_registrations FOR ALL 
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (public.is_current_user_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can update user profiles" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- 5. Grant execute permission on security definer functions
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_role(UUID) TO authenticated;