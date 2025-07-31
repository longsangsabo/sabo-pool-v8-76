
-- Step 1: Create utility functions for calculating dashboard statistics
CREATE OR REPLACE FUNCTION public.calculate_player_dashboard_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_stats jsonb;
  v_matches_played INTEGER;
  v_matches_won INTEGER;
  v_matches_lost INTEGER;
  v_tournaments_count INTEGER;
  v_current_ranking INTEGER;
  v_spa_points INTEGER;
  v_win_percentage NUMERIC;
BEGIN
  -- Get basic match statistics
  SELECT 
    COUNT(*) FILTER (WHERE (player1_id = p_user_id OR player2_id = p_user_id)),
    COUNT(*) FILTER (WHERE winner_id = p_user_id),
    COUNT(*) FILTER (WHERE (player1_id = p_user_id OR player2_id = p_user_id) AND winner_id != p_user_id AND winner_id IS NOT NULL)
  INTO v_matches_played, v_matches_won, v_matches_lost
  FROM public.matches
  WHERE (player1_id = p_user_id OR player2_id = p_user_id) 
    AND status = 'completed';

  -- Get tournament count
  SELECT COUNT(DISTINCT tournament_id) INTO v_tournaments_count
  FROM public.tournament_registrations
  WHERE user_id = p_user_id AND registration_status = 'confirmed';

  -- Get SPA points
  SELECT COALESCE(spa_points, 0) INTO v_spa_points
  FROM public.player_rankings
  WHERE user_id = p_user_id;

  -- Calculate win percentage
  v_win_percentage := CASE 
    WHEN v_matches_played > 0 THEN (v_matches_won::numeric / v_matches_played::numeric) * 100
    ELSE 0
  END;

  -- Get ranking position (simplified)
  SELECT COUNT(*) + 1 INTO v_current_ranking
  FROM public.player_rankings pr
  JOIN public.profiles p ON pr.user_id = p.user_id
  WHERE pr.spa_points > v_spa_points 
    AND p.is_demo_user = false;

  -- Build result
  v_stats := jsonb_build_object(
    'matches_played', COALESCE(v_matches_played, 0),
    'matches_won', COALESCE(v_matches_won, 0),
    'matches_lost', COALESCE(v_matches_lost, 0),
    'win_percentage', ROUND(COALESCE(v_win_percentage, 0), 1),
    'tournaments_joined', COALESCE(v_tournaments_count, 0),
    'current_ranking', COALESCE(v_current_ranking, 1),
    'spa_points', COALESCE(v_spa_points, 0)
  );

  RETURN v_stats;
END;
$function$;

-- Step 2: Create function for admin dashboard statistics
CREATE OR REPLACE FUNCTION public.calculate_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_stats jsonb;
  v_total_users INTEGER;
  v_active_users INTEGER;
  v_total_clubs INTEGER;
  v_pending_clubs INTEGER;
  v_tournaments_count INTEGER;
  v_active_tournaments INTEGER;
  v_total_matches INTEGER;
  v_completed_matches INTEGER;
  v_total_challenges INTEGER;
  v_active_challenges INTEGER;
BEGIN
  -- User statistics
  SELECT COUNT(*) INTO v_total_users
  FROM public.profiles
  WHERE is_demo_user = false;

  SELECT COUNT(*) INTO v_active_users
  FROM public.profiles
  WHERE is_demo_user = false
    AND ban_status = 'active'
    AND updated_at > NOW() - INTERVAL '30 days';

  -- Club statistics
  SELECT COUNT(*) INTO v_total_clubs
  FROM public.club_profiles
  WHERE verification_status = 'approved';

  SELECT COUNT(*) INTO v_pending_clubs
  FROM public.club_registrations
  WHERE status = 'pending';

  -- Tournament statistics
  SELECT COUNT(*) INTO v_tournaments_count
  FROM public.tournaments
  WHERE deleted_at IS NULL;

  SELECT COUNT(*) INTO v_active_tournaments
  FROM public.tournaments
  WHERE status IN ('registration_open', 'ongoing')
    AND deleted_at IS NULL;

  -- Match statistics
  SELECT COUNT(*) INTO v_total_matches
  FROM public.matches;

  SELECT COUNT(*) INTO v_completed_matches
  FROM public.matches
  WHERE status = 'completed';

  -- Challenge statistics
  SELECT COUNT(*) INTO v_total_challenges
  FROM public.challenges;

  SELECT COUNT(*) INTO v_active_challenges
  FROM public.challenges
  WHERE status IN ('pending', 'accepted');

  -- Build result
  v_stats := jsonb_build_object(
    'total_users', COALESCE(v_total_users, 0),
    'active_users', COALESCE(v_active_users, 0),
    'total_clubs', COALESCE(v_total_clubs, 0),
    'pending_clubs', COALESCE(v_pending_clubs, 0),
    'tournaments_count', COALESCE(v_tournaments_count, 0),
    'active_tournaments', COALESCE(v_active_tournaments, 0),
    'total_matches', COALESCE(v_total_matches, 0),
    'completed_matches', COALESCE(v_completed_matches, 0),
    'total_challenges', COALESCE(v_total_challenges, 0),
    'active_challenges', COALESCE(v_active_challenges, 0)
  );

  RETURN v_stats;
END;
$function$;

-- Step 3: Create function for club dashboard statistics
CREATE OR REPLACE FUNCTION public.calculate_club_dashboard_stats(p_club_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_stats jsonb;
  v_total_members INTEGER;
  v_active_members INTEGER;
  v_total_tournaments INTEGER;
  v_active_tournaments INTEGER;
  v_total_matches INTEGER;
  v_completed_matches INTEGER;
  v_pending_rank_requests INTEGER;
BEGIN
  -- Member statistics
  SELECT COUNT(*) INTO v_total_members
  FROM public.club_members
  WHERE club_id = p_club_id;

  SELECT COUNT(*) INTO v_active_members
  FROM public.club_members
  WHERE club_id = p_club_id
    AND status = 'active';

  -- Tournament statistics
  SELECT COUNT(*) INTO v_total_tournaments
  FROM public.tournaments
  WHERE club_id = p_club_id
    AND deleted_at IS NULL;

  SELECT COUNT(*) INTO v_active_tournaments
  FROM public.tournaments
  WHERE club_id = p_club_id
    AND status IN ('registration_open', 'ongoing')
    AND deleted_at IS NULL;

  -- Match statistics (matches in club tournaments)
  SELECT COUNT(*) INTO v_total_matches
  FROM public.tournament_matches tm
  JOIN public.tournaments t ON tm.tournament_id = t.id
  WHERE t.club_id = p_club_id;

  SELECT COUNT(*) INTO v_completed_matches
  FROM public.tournament_matches tm
  JOIN public.tournaments t ON tm.tournament_id = t.id
  WHERE t.club_id = p_club_id
    AND tm.status = 'completed';

  -- Rank requests
  SELECT COUNT(*) INTO v_pending_rank_requests
  FROM public.rank_verifications rv
  JOIN public.profiles p ON rv.user_id = p.user_id
  WHERE rv.club_id = p_club_id
    AND rv.status = 'pending';

  -- Build result
  v_stats := jsonb_build_object(
    'total_members', COALESCE(v_total_members, 0),
    'active_members', COALESCE(v_active_members, 0),
    'total_tournaments', COALESCE(v_total_tournaments, 0),
    'active_tournaments', COALESCE(v_active_tournaments, 0),
    'total_matches', COALESCE(v_total_matches, 0),
    'completed_matches', COALESCE(v_completed_matches, 0),
    'pending_rank_requests', COALESCE(v_pending_rank_requests, 0)
  );

  RETURN v_stats;
END;
$function$;
