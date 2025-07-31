-- Update ranks table with ELO points required for promotion
UPDATE public.ranks SET elo_points_required = 1 WHERE code = 'K';
UPDATE public.ranks SET elo_points_required = 2 WHERE code = 'K+';  
UPDATE public.ranks SET elo_points_required = 3 WHERE code = 'I';
UPDATE public.ranks SET elo_points_required = 4 WHERE code = 'I+';
UPDATE public.ranks SET elo_points_required = 5 WHERE code = 'H';
UPDATE public.ranks SET elo_points_required = 6 WHERE code = 'H+';
UPDATE public.ranks SET elo_points_required = 7 WHERE code = 'G';
UPDATE public.ranks SET elo_points_required = 8 WHERE code = 'G+';
UPDATE public.ranks SET elo_points_required = 9 WHERE code = 'E';

-- Add ELO points column to player_rankings if not exists
ALTER TABLE public.player_rankings 
ADD COLUMN IF NOT EXISTS elo_points NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_opponent_strength NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS performance_quality NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS club_verified BOOLEAN DEFAULT false;

-- Create function to calculate achievement points from tournament placement
CREATE OR REPLACE FUNCTION public.calculate_achievement_points(placement text)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  CASE placement
    WHEN 'CHAMPION' THEN RETURN 1.0;
    WHEN 'RUNNER_UP' THEN RETURN 0.5;
    WHEN 'THIRD_PLACE' THEN RETURN 0.25;
    WHEN 'FOURTH_PLACE' THEN RETURN 0.125;
    ELSE RETURN 0.0;
  END CASE;
END;
$$;

-- Create function to calculate average opponent strength
CREATE OR REPLACE FUNCTION public.calculate_average_opponent_strength(p_player_id uuid)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  avg_strength NUMERIC;
BEGIN
  SELECT AVG(
    CASE 
      WHEN mr.player1_id = p_player_id THEN mr.player2_elo_before
      ELSE mr.player1_elo_before
    END
  ) INTO avg_strength
  FROM public.match_results mr
  WHERE (mr.player1_id = p_player_id OR mr.player2_id = p_player_id)
  AND mr.result_status = 'verified'
  AND mr.match_date >= NOW() - INTERVAL '90 days';
  
  RETURN COALESCE(avg_strength, 0);
END;
$$;

-- Create function to calculate performance quality
CREATE OR REPLACE FUNCTION public.calculate_performance_quality(p_player_id uuid)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total_matches INTEGER;
  wins INTEGER;
  win_rate NUMERIC;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE winner_id = p_player_id)
  INTO total_matches, wins
  FROM public.match_results mr
  WHERE (mr.player1_id = p_player_id OR mr.player2_id = p_player_id)
  AND mr.result_status = 'verified'
  AND mr.match_date >= NOW() - INTERVAL '90 days';
  
  IF total_matches = 0 THEN
    RETURN 0;
  END IF;
  
  win_rate := wins::NUMERIC / total_matches::NUMERIC;
  RETURN win_rate;
END;
$$;

-- Update the check_rank_promotion function with new ELO-based logic
CREATE OR REPLACE FUNCTION public.check_rank_promotion(p_player_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_rank_id UUID;
  v_current_rank_level INTEGER;
  v_current_rank_code VARCHAR(3);
  v_next_rank_id UUID;
  v_next_rank_code VARCHAR(3);
  v_elo_points NUMERIC;
  v_total_matches INTEGER;
  v_avg_opponent_strength NUMERIC;
  v_performance_quality NUMERIC;
  v_club_verified BOOLEAN;
  v_required_elo_points NUMERIC;
  v_promoted BOOLEAN := FALSE;
BEGIN
  -- Get current player ranking info
  SELECT pr.elo_points, pr.total_matches, pr.current_rank_id, pr.club_verified, r.level, r.code
  INTO v_elo_points, v_total_matches, v_current_rank_id, v_club_verified, v_current_rank_level, v_current_rank_code
  FROM public.player_rankings pr
  LEFT JOIN public.ranks r ON pr.current_rank_id = r.id
  WHERE pr.player_id = p_player_id;

  -- If no ranking exists, start with K rank
  IF v_current_rank_id IS NULL THEN
    SELECT id INTO v_current_rank_id FROM public.ranks WHERE code = 'K';
    
    INSERT INTO public.player_rankings (player_id, current_rank_id, elo_points)
    VALUES (p_player_id, v_current_rank_id, COALESCE(v_elo_points, 0))
    ON CONFLICT (player_id) DO UPDATE SET current_rank_id = v_current_rank_id;
    
    RETURN FALSE;
  END IF;

  -- Calculate performance metrics
  v_avg_opponent_strength := calculate_average_opponent_strength(p_player_id);
  v_performance_quality := calculate_performance_quality(p_player_id);

  -- Update player metrics
  UPDATE public.player_rankings 
  SET average_opponent_strength = v_avg_opponent_strength,
      performance_quality = v_performance_quality
  WHERE player_id = p_player_id;

  -- Get next rank and required ELO points
  SELECT id, code, elo_points_required INTO v_next_rank_id, v_next_rank_code, v_required_elo_points
  FROM public.ranks 
  WHERE level = v_current_rank_level + 1;

  IF v_next_rank_id IS NOT NULL THEN
    -- Check all promotion criteria
    IF v_elo_points >= v_required_elo_points 
       AND v_total_matches >= 10
       AND v_avg_opponent_strength >= 800
       AND v_performance_quality >= 0.6
       AND v_club_verified = true THEN
      
      -- Promote player
      UPDATE public.player_rankings 
      SET current_rank_id = v_next_rank_id,
          updated_at = NOW()
      WHERE player_id = p_player_id;

      -- Log promotion history
      INSERT INTO public.ranking_history (player_id, old_rank_id, new_rank_id, promotion_type, total_points_earned)
      VALUES (p_player_id, v_current_rank_id, v_next_rank_id, 'elo_based', v_elo_points);

      -- Create notification
      INSERT INTO public.notifications (user_id, type, title, message, action_url, priority)
      VALUES (p_player_id, 'rank_promotion', 'Chúc mừng thăng hạng!', 
              format('Bạn đã thăng hạng từ %s lên %s với %s điểm ELO', v_current_rank_code, v_next_rank_code, v_elo_points),
              '/profile?tab=ranking', 'high');

      v_promoted := TRUE;
    END IF;
  END IF;

  RETURN v_promoted;
END;
$$;

-- Create function to award ELO points from tournament results
CREATE OR REPLACE FUNCTION public.award_tournament_elo_points(p_player_id uuid, p_tournament_id uuid, p_placement text)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_points NUMERIC;
BEGIN
  v_points := calculate_achievement_points(p_placement);
  
  -- Update player's ELO points
  UPDATE public.player_rankings 
  SET elo_points = elo_points + v_points,
      updated_at = NOW()
  WHERE player_id = p_player_id;
  
  -- Log the ELO points award
  INSERT INTO public.spa_points_log (player_id, source_type, points_earned, description, metadata)
  VALUES (
    p_player_id, 
    'tournament_elo', 
    v_points::INTEGER,
    format('ELO points from tournament placement: %s', p_placement),
    jsonb_build_object('tournament_id', p_tournament_id, 'placement', p_placement)
  );
  
  -- Check for rank promotion
  PERFORM check_rank_promotion(p_player_id);
  
  RETURN v_points;
END;
$$;