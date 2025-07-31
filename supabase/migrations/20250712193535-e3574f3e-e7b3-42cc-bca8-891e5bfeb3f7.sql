-- Update the create_user_complete_records function to not assign default rank
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

  -- Create player_rankings record - No default verified_rank, user must get verified by club
  INSERT INTO public.player_rankings (
    user_id, elo_points, spa_points, total_matches, wins, 
    daily_challenges, tournament_wins, rank_points, 
    average_opponent_strength, performance_quality, club_verified, is_visible,
    verified_rank, verified_at, verified_by
  )
  VALUES (NEW.user_id, 1000, 50, 0, 0, 0, 0, 0, 0, 0, false, true, NULL, NULL, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;