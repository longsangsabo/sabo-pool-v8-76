-- Create player_milestones table to track completed milestones
CREATE TABLE IF NOT EXISTS public.player_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  milestone_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, milestone_id)
);

-- Enable RLS
ALTER TABLE public.player_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own milestones" 
ON public.player_milestones 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage player milestones" 
ON public.player_milestones 
FOR ALL 
WITH CHECK (TRUE);

-- Add some default milestone data if spa_reward_milestones is empty
INSERT INTO public.spa_reward_milestones (milestone_name, milestone_type, requirement_value, spa_reward)
VALUES 
  ('First Steps', 'matches_played', 10, 100),
  ('Rising Star', 'matches_played', 50, 200),
  ('Veteran Player', 'matches_played', 100, 500),
  ('Balanced Warrior', 'win_rate', 20, 150),
  ('Tournament Debut', 'tournaments_joined', 1, 200),
  ('SPA Collector', 'spa_points', 1000, 300),
  ('Challenge Master', 'challenges_won', 20, 250),
  ('Win Streak', 'win_streak', 5, 200)
ON CONFLICT (milestone_name) DO NOTHING;

-- Function to get player activity stats
CREATE OR REPLACE FUNCTION public.get_player_activity_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_pending_challenges INTEGER;
  v_matches_this_week INTEGER;
  v_upcoming_tournaments INTEGER;
  v_result JSONB;
BEGIN
  -- Get pending challenges (where user is opponent)
  SELECT COUNT(*) INTO v_pending_challenges
  FROM public.challenges
  WHERE opponent_id = p_user_id 
    AND status = 'pending';
  
  -- Get matches this week
  SELECT COUNT(*) INTO v_matches_this_week
  FROM public.matches
  WHERE (player1_id = p_user_id OR player2_id = p_user_id)
    AND status = 'completed'
    AND played_at >= DATE_TRUNC('week', NOW());
  
  -- Get upcoming tournaments (user is registered)
  SELECT COUNT(*) INTO v_upcoming_tournaments
  FROM public.tournament_registrations tr
  JOIN public.tournaments t ON tr.tournament_id = t.id
  WHERE tr.user_id = p_user_id
    AND tr.registration_status = 'confirmed'
    AND t.status IN ('registration_open', 'registration_closed')
    AND t.tournament_start > NOW();
  
  v_result := jsonb_build_object(
    'pending_challenges', COALESCE(v_pending_challenges, 0),
    'matches_this_week', COALESCE(v_matches_this_week, 0),
    'upcoming_tournaments', COALESCE(v_upcoming_tournaments, 0)
  );
  
  RETURN v_result;
END;
$$;

-- Function to check and award milestones
CREATE OR REPLACE FUNCTION public.check_and_award_milestones(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_milestone RECORD;
  v_user_stats RECORD;
  v_awarded_count INTEGER := 0;
  v_new_milestones JSONB[] := '{}';
BEGIN
  -- Get user stats
  SELECT 
    pr.total_matches,
    pr.wins,
    pr.spa_points,
    pr.win_streak,
    CASE WHEN pr.total_matches > 0 THEN (pr.wins::DECIMAL / pr.total_matches) * 100 ELSE 0 END as win_rate
  INTO v_user_stats
  FROM public.player_rankings pr
  WHERE pr.user_id = p_user_id;
  
  -- If no stats found, return
  IF v_user_stats IS NULL THEN
    RETURN jsonb_build_object('awarded_count', 0, 'new_milestones', '[]'::jsonb);
  END IF;
  
  -- Check each milestone
  FOR v_milestone IN
    SELECT * FROM public.spa_reward_milestones
    WHERE id NOT IN (
      SELECT milestone_id FROM public.player_milestones 
      WHERE user_id = p_user_id
    )
  LOOP
    -- Check if milestone conditions are met
    IF (v_milestone.milestone_type = 'matches_played' AND v_user_stats.total_matches >= v_milestone.requirement_value) OR
       (v_milestone.milestone_type = 'win_rate' AND v_user_stats.win_rate >= 50 AND v_user_stats.total_matches >= v_milestone.requirement_value) OR
       (v_milestone.milestone_type = 'spa_points' AND v_user_stats.spa_points >= v_milestone.requirement_value) OR
       (v_milestone.milestone_type = 'win_streak' AND v_user_stats.win_streak >= v_milestone.requirement_value) THEN
      
      -- Award milestone
      INSERT INTO public.player_milestones (user_id, milestone_id)
      VALUES (p_user_id, v_milestone.id)
      ON CONFLICT (user_id, milestone_id) DO NOTHING;
      
      -- Award SPA points
      UPDATE public.player_rankings
      SET spa_points = spa_points + v_milestone.spa_reward,
          updated_at = NOW()
      WHERE user_id = p_user_id;
      
      -- Log the points
      INSERT INTO public.spa_points_log (user_id, points_earned, category, description)
      VALUES (p_user_id, v_milestone.spa_reward, 'milestone', v_milestone.milestone_name);
      
      v_awarded_count := v_awarded_count + 1;
      v_new_milestones := v_new_milestones || jsonb_build_object(
        'milestone_name', v_milestone.milestone_name,
        'spa_reward', v_milestone.spa_reward
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'awarded_count', v_awarded_count,
    'new_milestones', v_new_milestones
  );
END;
$$;