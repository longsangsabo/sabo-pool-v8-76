-- Update all remaining database function parameters from p_player_id to p_user_id

-- 1. Update award_tournament_elo_points function
DROP FUNCTION IF EXISTS public.award_tournament_elo_points(text, text, text);
CREATE OR REPLACE FUNCTION public.award_tournament_elo_points(
  p_user_id uuid,
  p_tournament_id uuid,
  p_placement text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_points INTEGER := 0;
  v_multiplier NUMERIC := 1.0;
BEGIN
  -- Calculate base points based on placement
  v_points := CASE p_placement
    WHEN '1' THEN 100
    WHEN '2' THEN 70
    WHEN '3' THEN 50
    WHEN '4' THEN 30
    ELSE 10
  END;
  
  -- Apply tournament type multiplier
  SELECT CASE tournament_type
    WHEN 'season' THEN 1.5
    WHEN 'open' THEN 2.0
    ELSE 1.0
  END INTO v_multiplier
  FROM public.tournaments
  WHERE id = p_tournament_id;
  
  v_points := ROUND(v_points * v_multiplier);
  
  -- Update player ranking
  UPDATE public.player_rankings
  SET elo_points = elo_points + v_points,
      updated_at = NOW()
  WHERE player_id = p_user_id;
  
  RETURN v_points;
END;
$function$;

-- 2. Update award_tournament_points function
DROP FUNCTION IF EXISTS public.award_tournament_points(text, text, integer, text);
CREATE OR REPLACE FUNCTION public.award_tournament_points(
  p_tournament_id uuid,
  p_user_id uuid,
  p_position integer,
  p_player_rank text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_base_points INTEGER;
  v_rank_multiplier NUMERIC;
  v_total_points INTEGER;
BEGIN
  -- Calculate base points based on position
  v_base_points := CASE 
    WHEN p_position = 1 THEN 1000
    WHEN p_position = 2 THEN 700
    WHEN p_position = 3 THEN 500
    WHEN p_position = 4 THEN 400
    WHEN p_position <= 8 THEN 300
    WHEN p_position <= 16 THEN 200
    ELSE 100
  END;
  
  -- Apply rank multiplier
  v_rank_multiplier := CASE p_player_rank
    WHEN 'novice' THEN 1.0
    WHEN 'amateur' THEN 1.1
    WHEN 'semi_pro' THEN 1.2
    WHEN 'pro' THEN 1.3
    ELSE 1.0
  END;
  
  v_total_points := ROUND(v_base_points * v_rank_multiplier);
  
  -- Update player ranking
  UPDATE public.player_rankings
  SET spa_points = spa_points + v_total_points,
      updated_at = NOW()
  WHERE player_id = p_user_id;
  
  RETURN v_total_points;
END;
$function$;

-- 3. Update award_tournament_spa_with_audit function
DROP FUNCTION IF EXISTS public.award_tournament_spa_with_audit(text, text, text, text, text, text);
CREATE OR REPLACE FUNCTION public.award_tournament_spa_with_audit(
  p_tournament_id uuid,
  p_user_id uuid,
  p_position text,
  p_player_rank text,
  p_tournament_type text DEFAULT 'regular',
  p_calculated_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_points INTEGER;
  v_result JSONB;
BEGIN
  -- Calculate points
  SELECT public.award_tournament_points(p_tournament_id, p_user_id, p_position::integer, p_player_rank)
  INTO v_points;
  
  -- Log the award
  INSERT INTO public.spa_points_log (
    player_id, source_type, source_id, points_earned, 
    description, calculated_by
  ) VALUES (
    p_user_id, 'tournament', p_tournament_id, v_points,
    format('Tournament %s - Position %s', p_tournament_type, p_position),
    p_calculated_by
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'points_awarded', v_points,
    'user_id', p_user_id,
    'tournament_id', p_tournament_id
  );
  
  RETURN v_result;
END;
$function$;

-- 4. Update calculate_average_opponent_strength function
DROP FUNCTION IF EXISTS public.calculate_average_opponent_strength(text);
CREATE OR REPLACE FUNCTION public.calculate_average_opponent_strength(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_avg_strength NUMERIC := 0;
BEGIN
  SELECT COALESCE(AVG(
    CASE 
      WHEN mr.player1_id = p_user_id THEN pr2.elo_points
      ELSE pr1.elo_points
    END
  ), 0) INTO v_avg_strength
  FROM public.match_results mr
  LEFT JOIN public.player_rankings pr1 ON mr.player1_id = pr1.player_id
  LEFT JOIN public.player_rankings pr2 ON mr.player2_id = pr2.player_id
  WHERE (mr.player1_id = p_user_id OR mr.player2_id = p_user_id)
  AND mr.result_status = 'verified'
  AND mr.created_at >= NOW() - INTERVAL '90 days';
  
  RETURN COALESCE(v_avg_strength, 0);
END;
$function$;

-- 5. Update calculate_comeback_bonus function
DROP FUNCTION IF EXISTS public.calculate_comeback_bonus(text);
CREATE OR REPLACE FUNCTION public.calculate_comeback_bonus(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_comeback_matches INTEGER := 0;
  v_bonus INTEGER := 0;
BEGIN
  -- Count comeback victories (when behind by 2+ games)
  SELECT COUNT(*) INTO v_comeback_matches
  FROM public.match_results mr
  WHERE mr.winner_id = p_user_id
  AND mr.result_status = 'verified'
  AND mr.created_at >= NOW() - INTERVAL '30 days'
  AND (
    (mr.player1_id = p_user_id AND mr.player1_score - mr.player2_score >= 2)
    OR
    (mr.player2_id = p_user_id AND mr.player2_score - mr.player1_score >= 2)
  );
  
  v_bonus := v_comeback_matches * 5; -- 5 points per comeback
  
  RETURN v_bonus;
END;
$function$;

-- 6. Update calculate_enhanced_elo function
DROP FUNCTION IF EXISTS public.calculate_enhanced_elo(text, text, integer, integer, jsonb);
CREATE OR REPLACE FUNCTION public.calculate_enhanced_elo(
  p_user_id uuid,
  p_tournament_id uuid,
  p_final_position integer,
  p_total_participants integer,
  p_match_results jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_base_elo INTEGER;
  v_position_bonus INTEGER;
  v_performance_bonus INTEGER;
  v_total_elo INTEGER;
  v_result JSONB;
BEGIN
  -- Get current ELO
  SELECT COALESCE(elo_points, 1000) INTO v_base_elo
  FROM public.player_rankings
  WHERE player_id = p_user_id;
  
  -- Calculate position bonus
  v_position_bonus := CASE 
    WHEN p_final_position = 1 THEN 100
    WHEN p_final_position = 2 THEN 60
    WHEN p_final_position = 3 THEN 40
    WHEN p_final_position <= 4 THEN 20
    WHEN p_final_position <= 8 THEN 10
    ELSE 0
  END;
  
  -- Calculate performance bonus based on opponent strength
  v_performance_bonus := public.calculate_average_opponent_strength(p_user_id)::integer / 50;
  
  v_total_elo := v_base_elo + v_position_bonus + v_performance_bonus;
  
  -- Update player ranking
  UPDATE public.player_rankings
  SET elo_points = v_total_elo,
      updated_at = NOW()
  WHERE player_id = p_user_id;
  
  v_result := jsonb_build_object(
    'success', true,
    'old_elo', v_base_elo,
    'new_elo', v_total_elo,
    'position_bonus', v_position_bonus,
    'performance_bonus', v_performance_bonus
  );
  
  RETURN v_result;
END;
$function$;

-- 7. Update calculate_performance_quality function
DROP FUNCTION IF EXISTS public.calculate_performance_quality(text);
CREATE OR REPLACE FUNCTION public.calculate_performance_quality(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_quality_score NUMERIC := 0;
  v_win_rate NUMERIC;
  v_avg_opponent NUMERIC;
BEGIN
  -- Calculate recent win rate
  SELECT 
    CASE WHEN COUNT(*) > 0 
    THEN COUNT(CASE WHEN winner_id = p_user_id THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC
    ELSE 0 END
  INTO v_win_rate
  FROM public.match_results
  WHERE (player1_id = p_user_id OR player2_id = p_user_id)
  AND result_status = 'verified'
  AND created_at >= NOW() - INTERVAL '30 days';
  
  -- Get average opponent strength
  v_avg_opponent := public.calculate_average_opponent_strength(p_user_id);
  
  -- Combine factors
  v_quality_score := (v_win_rate * 50) + (v_avg_opponent / 20);
  
  RETURN COALESCE(v_quality_score, 0);
END;
$function$;

-- 8. Update calculate_streak_bonus function
DROP FUNCTION IF EXISTS public.calculate_streak_bonus(text, integer);
CREATE OR REPLACE FUNCTION public.calculate_streak_bonus(
  p_user_id uuid,
  p_base_points integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_current_streak INTEGER := 0;
  v_bonus INTEGER := 0;
BEGIN
  -- Get current win streak
  SELECT COALESCE(win_streak, 0) INTO v_current_streak
  FROM public.player_rankings
  WHERE player_id = p_user_id;
  
  -- Calculate bonus: 5% per win in streak, max 50%
  v_bonus := LEAST(v_current_streak * 5, 50);
  
  RETURN ROUND(p_base_points * v_bonus / 100);
END;
$function$;

-- 9. Update check_and_award_milestones function
DROP FUNCTION IF EXISTS public.check_and_award_milestones(text);
CREATE OR REPLACE FUNCTION public.check_and_award_milestones(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_ranking RECORD;
  v_milestones JSONB := '[]'::jsonb;
  v_milestone JSONB;
BEGIN
  -- Get player ranking
  SELECT * INTO v_ranking
  FROM public.player_rankings
  WHERE player_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Player not found');
  END IF;
  
  -- Check for various milestones
  -- 100 matches milestone
  IF v_ranking.total_matches >= 100 AND v_ranking.total_matches - 1 < 100 THEN
    v_milestone := jsonb_build_object(
      'type', '100_matches',
      'title', '100 Trận Đấu',
      'description', 'Hoàn thành 100 trận đấu',
      'points', 500
    );
    v_milestones := v_milestones || v_milestone;
  END IF;
  
  -- 50 wins milestone
  IF v_ranking.wins >= 50 AND v_ranking.wins - 1 < 50 THEN
    v_milestone := jsonb_build_object(
      'type', '50_wins',
      'title', '50 Chiến Thắng',
      'description', 'Giành 50 chiến thắng',
      'points', 750
    );
    v_milestones := v_milestones || v_milestone;
  END IF;
  
  -- High ELO milestone
  IF v_ranking.elo_points >= 1500 THEN
    v_milestone := jsonb_build_object(
      'type', 'high_elo',
      'title', 'Cao Thủ',
      'description', 'Đạt 1500+ ELO',
      'points', 1000
    );
    v_milestones := v_milestones || v_milestone;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'milestones', v_milestones,
    'user_id', p_user_id
  );
END;
$function$;

-- 10. Update check_rank_promotion function (already updated but ensure it's correct)
DROP FUNCTION IF EXISTS public.check_rank_promotion(text);
-- Function was already updated in previous migration