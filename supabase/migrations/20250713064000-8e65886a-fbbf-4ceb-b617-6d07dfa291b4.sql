-- Drop functions and recreate with correct parameter names

-- Drop existing functions
DROP FUNCTION IF EXISTS public.check_rank_promotion(uuid);
DROP FUNCTION IF EXISTS public.award_tournament_points(uuid, uuid, integer, text);

-- Recreate with correct user_id parameters

-- 1. Fix check_rank_promotion function to use user_id
CREATE OR REPLACE FUNCTION public.check_rank_promotion(p_user_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_rank RECORD;
  v_next_rank RECORD;
  v_player_stats RECORD;
  v_can_promote BOOLEAN := false;
BEGIN
  -- Get current player stats
  SELECT 
    pr.elo_points,
    pr.total_matches,
    pr.spa_points,
    pr.verified_rank,
    pr.club_verified
  INTO v_player_stats
  FROM public.player_rankings pr
  WHERE pr.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get current rank details
  SELECT * INTO v_current_rank
  FROM public.ranks
  WHERE code = v_player_stats.verified_rank;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get next rank
  SELECT * INTO v_next_rank
  FROM public.ranks
  WHERE rank_order = v_current_rank.rank_order + 1;
  
  IF NOT FOUND THEN
    RETURN false; -- Already at highest rank
  END IF;
  
  -- Check promotion criteria
  v_can_promote := (
    v_player_stats.elo_points >= v_next_rank.min_elo AND
    v_player_stats.total_matches >= v_next_rank.required_matches AND
    v_player_stats.club_verified = true
  );
  
  -- If eligible, update the rank
  IF v_can_promote THEN
    UPDATE public.player_rankings
    SET verified_rank = v_next_rank.code,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Log the promotion
    INSERT INTO public.rank_adjustments (
      user_id,
      old_rank,
      new_rank,
      adjustment_type,
      reason,
      admin_id
    ) VALUES (
      p_user_id,
      v_current_rank.code,
      v_next_rank.code,
      'promotion',
      'Automatic promotion based on ELO and matches',
      NULL
    );
  END IF;
  
  RETURN v_can_promote;
END;
$$;

-- 2. Fix award_tournament_points function to use user_id
CREATE OR REPLACE FUNCTION public.award_tournament_points(
  p_tournament_id uuid,
  p_user_id uuid,
  p_position integer,
  p_player_rank text
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points INTEGER;
  v_multiplier NUMERIC := 1.0;
  v_tournament RECORD;
  v_result JSONB;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament 
  FROM public.tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Calculate base points based on position
  v_points := CASE 
    WHEN p_position = 1 THEN 1000
    WHEN p_position = 2 THEN 700
    WHEN p_position = 3 THEN 500
    WHEN p_position = 4 THEN 400
    WHEN p_position <= 8 THEN 300
    WHEN p_position <= 16 THEN 200
    ELSE 100
  END;
  
  -- Apply tournament type multiplier
  v_multiplier := CASE 
    WHEN v_tournament.tournament_type = 'season' THEN 1.5
    WHEN v_tournament.tournament_type = 'open' THEN 2.0
    ELSE 1.0
  END;
  
  -- Calculate final points
  v_points := ROUND(v_points * v_multiplier);
  
  -- Award SPA points using the credit_spa_points function
  SELECT public.credit_spa_points(
    p_user_id,
    v_points,
    'tournament',
    format('Tournament %s - Position %s', v_tournament.name, p_position),
    p_tournament_id,
    'tournament'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;