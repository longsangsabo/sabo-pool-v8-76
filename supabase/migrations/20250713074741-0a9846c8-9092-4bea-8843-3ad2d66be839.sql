-- Fix all remaining player_id references in functions and triggers

-- 1. Fix sync_spa_points_on_update trigger function
CREATE OR REPLACE FUNCTION public.sync_spa_points_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update wallets table when player_rankings spa_points changes
  UPDATE public.wallets
  SET points_balance = NEW.spa_points,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;  -- FIXED: Changed from NEW.player_id to NEW.user_id
  
  -- Create wallet if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, points_balance, balance, status)
    VALUES (NEW.user_id, NEW.spa_points, 0, 'active');  -- FIXED: Changed from NEW.player_id to NEW.user_id
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix recalculate_rankings function
CREATE OR REPLACE FUNCTION public.recalculate_rankings()
RETURNS void AS $$
BEGIN
  -- Clear existing leaderboard for current month
  DELETE FROM public.leaderboards 
  WHERE month = EXTRACT(MONTH FROM CURRENT_DATE)
    AND year = EXTRACT(YEAR FROM CURRENT_DATE);
    
  -- Recalculate leaderboard positions
  WITH ranked_players AS (
    SELECT 
      pr.user_id,  -- FIXED: Changed from pr.player_id to pr.user_id
      pr.spa_points as ranking_points,
      pr.total_matches,
      pr.wins as total_wins,
      CASE 
        WHEN pr.total_matches > 0 THEN (pr.wins::numeric / pr.total_matches * 100)
        ELSE 0 
      END as win_rate,
      p.city,
      p.district,
      r.code as rank_category,
      ROW_NUMBER() OVER (ORDER BY pr.spa_points DESC, pr.wins DESC) as position
    FROM public.player_rankings pr
    JOIN public.profiles p ON pr.user_id = p.user_id  -- FIXED: Changed from pr.player_id to pr.user_id
    LEFT JOIN public.ranks r ON pr.current_rank_id = r.id
    WHERE pr.spa_points > 0
  )
  INSERT INTO public.leaderboards (
    player_id, position, ranking_points, total_matches, total_wins, 
    win_rate, city, district, rank_category, month, year
  )
  SELECT 
    user_id, position, ranking_points, total_matches, total_wins,  -- FIXED: Changed from player_id to user_id
    win_rate, city, district, rank_category,
    EXTRACT(MONTH FROM CURRENT_DATE)::integer,
    EXTRACT(YEAR FROM CURRENT_DATE)::integer
  FROM ranked_players;
  
  -- Log recalculation
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'ranking_recalculation',
    'Weekly ranking recalculation completed',
    jsonb_build_object(
      'players_ranked', (SELECT COUNT(*) FROM public.leaderboards 
                        WHERE month = EXTRACT(MONTH FROM CURRENT_DATE) 
                        AND year = EXTRACT(YEAR FROM CURRENT_DATE))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;