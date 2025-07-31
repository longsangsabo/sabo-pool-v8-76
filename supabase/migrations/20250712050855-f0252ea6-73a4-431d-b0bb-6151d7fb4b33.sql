-- Create function to ensure all users have complete records
CREATE OR REPLACE FUNCTION public.ensure_user_complete_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Create wallet records for users who don't have them
  INSERT INTO public.wallets (user_id, balance, points_balance, status)
  SELECT 
    p.user_id,
    0 as balance,
    COALESCE(pr.spa_points, 50) as points_balance,
    'active' as status
  FROM public.profiles p
  LEFT JOIN public.wallets w ON w.user_id = p.user_id
  LEFT JOIN public.player_rankings pr ON pr.player_id = p.user_id
  WHERE w.user_id IS NULL
  ON CONFLICT (user_id) DO NOTHING;

  -- Create player_rankings records for users who don't have them  
  INSERT INTO public.player_rankings (
    player_id, 
    elo_points, 
    spa_points, 
    total_matches, 
    wins, 
    daily_challenges,
    tournament_wins,
    rank_points,
    average_opponent_strength,
    performance_quality,
    club_verified,
    is_visible
  )
  SELECT 
    p.user_id,
    1000 as elo_points,
    COALESCE(w.points_balance, 50) as spa_points,
    0 as total_matches,
    0 as wins,
    0 as daily_challenges,
    0 as tournament_wins,
    0 as rank_points,
    0 as average_opponent_strength,
    0 as performance_quality,
    false as club_verified,
    true as is_visible
  FROM public.profiles p
  LEFT JOIN public.player_rankings pr ON pr.player_id = p.user_id
  LEFT JOIN public.wallets w ON w.user_id = p.user_id
  WHERE pr.player_id IS NULL
  ON CONFLICT (player_id) DO NOTHING;

  -- Sync existing data between wallets and player_rankings
  UPDATE public.player_rankings 
  SET spa_points = w.points_balance,
      updated_at = now()
  FROM public.wallets w
  WHERE player_rankings.player_id = w.user_id
  AND player_rankings.spa_points != w.points_balance;

  RAISE NOTICE 'User records synchronization completed';
END;
$function$;

-- Run the function to ensure all current users have complete records
SELECT public.ensure_user_complete_records();

-- Create trigger to auto-create records when new user is created
CREATE OR REPLACE FUNCTION public.create_user_complete_records()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Create wallet record
  INSERT INTO public.wallets (user_id, balance, points_balance, status)
  VALUES (NEW.user_id, 0, 50, 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create player_rankings record
  INSERT INTO public.player_rankings (
    player_id, elo_points, spa_points, total_matches, wins, 
    daily_challenges, tournament_wins, rank_points, 
    average_opponent_strength, performance_quality, club_verified, is_visible
  )
  VALUES (NEW.user_id, 1000, 50, 0, 0, 0, 0, 0, 0, 0, false, true)
  ON CONFLICT (player_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS ensure_complete_user_records ON public.profiles;
CREATE TRIGGER ensure_complete_user_records
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_complete_records();