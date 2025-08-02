-- Continue fixing remaining functions with search_path security issues

-- 4. Fix get_player_activity_stats function
CREATE OR REPLACE FUNCTION public.get_player_activity_stats(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 5. Fix get_tournament_rewards_structured function
CREATE OR REPLACE FUNCTION public.get_tournament_rewards_structured(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
  v_prize_tiers JSONB;
  v_special_awards JSONB;
  v_point_config JSONB;
  v_physical_prizes JSONB;
BEGIN
  -- Get prize tiers
  SELECT jsonb_agg(
    jsonb_build_object(
      'position', position,
      'position_name', position_name,
      'cash_prize', cash_prize,
      'elo_points', elo_points,
      'spa_points', spa_points,
      'is_visible', is_visible
    ) ORDER BY position
  ) INTO v_prize_tiers
  FROM public.tournament_prize_tiers
  WHERE tournament_id = p_tournament_id;
  
  -- Get special awards
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'award_name', award_name,
      'description', description,
      'cash_prize', cash_prize,
      'criteria', criteria
    )
  ) INTO v_special_awards
  FROM public.tournament_special_awards
  WHERE tournament_id = p_tournament_id;
  
  -- Get point configuration
  SELECT jsonb_build_object(
    'tier_level', tier_level,
    'base_elo_points', base_elo_points,
    'base_spa_points', base_spa_points,
    'points_multiplier', points_multiplier
  ) INTO v_point_config
  FROM public.tournament_point_configs
  WHERE tournament_id = p_tournament_id;
  
  -- Get physical prizes
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'prize_name', prize_name,
      'description', description,
      'position', position,
      'quantity', quantity,
      'estimated_value', estimated_value
    ) ORDER BY position
  ) INTO v_physical_prizes
  FROM public.tournament_physical_prizes
  WHERE tournament_id = p_tournament_id;
  
  v_result := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'prize_tiers', COALESCE(v_prize_tiers, '[]'::jsonb),
    'special_awards', COALESCE(v_special_awards, '[]'::jsonb),
    'point_config', v_point_config,
    'physical_prizes', COALESCE(v_physical_prizes, '[]'::jsonb)
  );
  
  RETURN v_result;
END;
$function$;

-- 6. Fix check_and_award_milestones function  
CREATE OR REPLACE FUNCTION public.check_and_award_milestones(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;