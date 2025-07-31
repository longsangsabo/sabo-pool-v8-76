-- Fix critical functions that are commonly used with player_id references

-- Fix apply_elo_decay function
CREATE OR REPLACE FUNCTION public.apply_elo_decay()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  decay_30_days INTEGER := 2; -- 2 points per week after 30 days
  decay_60_days INTEGER := 5; -- 5 points per week after 60 days
  affected_count INTEGER := 0;
BEGIN
  -- Apply decay to players inactive for 30+ days (FIXED: using user_id)
  WITH inactive_players AS (
    UPDATE public.player_rankings pr
    SET elo_points = GREATEST(1000, elo_points - decay_30_days),
        updated_at = now()
    FROM public.profiles p
    WHERE pr.user_id = p.user_id
    AND pr.updated_at < now() - INTERVAL '30 days'
    AND pr.updated_at >= now() - INTERVAL '60 days'
    AND pr.elo_points > 1000
    RETURNING pr.user_id, decay_30_days as decay_amount
  )
  INSERT INTO public.elo_history (user_id, elo_before, elo_after, elo_change, match_result)
  SELECT 
    ip.user_id,
    pr.elo_points + ip.decay_amount,
    pr.elo_points,
    -ip.decay_amount,
    'decay_30_days'
  FROM inactive_players ip
  JOIN public.player_rankings pr ON pr.user_id = ip.user_id;
  
  -- Apply stronger decay to players inactive for 60+ days (FIXED: using user_id)
  WITH very_inactive_players AS (
    UPDATE public.player_rankings pr
    SET elo_points = GREATEST(1000, elo_points - decay_60_days),
        updated_at = now()
    FROM public.profiles p
    WHERE pr.user_id = p.user_id
    AND pr.updated_at < now() - INTERVAL '60 days'
    AND pr.elo_points > 1000
    RETURNING pr.user_id, decay_60_days as decay_amount
  )
  INSERT INTO public.elo_history (user_id, elo_before, elo_after, elo_change, match_result)
  SELECT 
    vip.user_id,
    pr.elo_points + vip.decay_amount,
    pr.elo_points,
    -vip.decay_amount,
    'decay_60_days'
  FROM very_inactive_players vip
  JOIN public.player_rankings pr ON pr.user_id = vip.user_id;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  -- Log decay application
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'elo_decay',
    'Applied ELO decay to inactive players',
    jsonb_build_object(
      'affected_players', affected_count,
      'decay_30_days', decay_30_days,
      'decay_60_days', decay_60_days
    )
  );
END;
$function$;

-- Fix award_challenge_points function
CREATE OR REPLACE FUNCTION public.award_challenge_points(p_winner_id uuid, p_loser_id uuid, p_wager_points integer, p_rank_difference numeric DEFAULT 0)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_winner_points INTEGER;
  v_loser_points INTEGER;
  v_multiplier DECIMAL := 1.0;
  v_daily_count INTEGER;
BEGIN
  -- Check daily challenge count for winner (FIXED: using user_id)
  SELECT COUNT(*) INTO v_daily_count
  FROM public.spa_points_log
  WHERE user_id = p_winner_id
    AND source_type = 'challenge'
    AND created_at >= CURRENT_DATE;

  -- Apply daily limit multiplier
  IF v_daily_count >= 2 THEN
    v_multiplier := 0.3; -- 3rd+ challenge gets 30% points
  END IF;

  -- Calculate winner points
  v_winner_points := p_wager_points;
  
  -- Rank difference bonus (25% bonus for beating higher rank)
  IF p_rank_difference >= 0.5 THEN
    v_winner_points := ROUND(v_winner_points * 1.25);
  END IF;

  -- Apply daily multiplier
  v_winner_points := ROUND(v_winner_points * v_multiplier);

  -- Calculate loser points (loses 50% of wager)
  v_loser_points := -ROUND(p_wager_points * 0.5);

  -- Log winner points (FIXED: using user_id)
  INSERT INTO public.spa_points_log (user_id, source_type, points_earned, description)
  VALUES (p_winner_id, 'challenge', v_winner_points, 
          format('Won challenge (%s daily)', v_daily_count + 1));

  -- Log loser points (FIXED: using user_id)
  INSERT INTO public.spa_points_log (user_id, source_type, points_earned, description)
  VALUES (p_loser_id, 'challenge', v_loser_points, 'Lost challenge');

  -- Update player SPA points (FIXED: using user_id)
  INSERT INTO public.player_rankings (user_id, spa_points, total_matches, wins)
  VALUES (p_winner_id, v_winner_points, 1, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    spa_points = player_rankings.spa_points + v_winner_points,
    total_matches = player_rankings.total_matches + 1,
    wins = player_rankings.wins + 1,
    updated_at = NOW();

  INSERT INTO public.player_rankings (user_id, spa_points, total_matches)
  VALUES (p_loser_id, ABS(v_loser_points), 1)
  ON CONFLICT (user_id) DO UPDATE SET
    spa_points = GREATEST(0, player_rankings.spa_points + v_loser_points),
    total_matches = player_rankings.total_matches + 1,
    updated_at = NOW();

  RETURN v_winner_points;
END;
$function$;