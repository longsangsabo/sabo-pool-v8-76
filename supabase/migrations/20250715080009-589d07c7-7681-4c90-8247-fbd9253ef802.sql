-- Drop and recreate functions with corrected player_id -> user_id references

-- Drop existing functions that have player_id parameters
DROP FUNCTION IF EXISTS public.optimize_leaderboard_query(integer, integer, text, text);
DROP FUNCTION IF EXISTS public.get_tournament_registration_priority(uuid);
DROP FUNCTION IF EXISTS public.award_tournament_points(uuid, uuid, integer, text);

-- Recreate optimize_leaderboard_query with user_id instead of player_id
CREATE OR REPLACE FUNCTION public.optimize_leaderboard_query(p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_city text DEFAULT NULL::text, p_search text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, user_id uuid, ranking_points integer, total_wins integer, total_matches integer, win_rate numeric, full_name text, display_name text, avatar_url text, city text, district text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.user_id,
    l.ranking_points,
    l.total_wins,
    l.total_matches,
    l.win_rate,
    p.full_name,
    p.display_name,
    p.avatar_url,
    l.city,
    l.district
  FROM leaderboards l
  JOIN profiles p ON l.user_id = p.user_id
  WHERE l.month = EXTRACT(MONTH FROM NOW())
    AND l.year = EXTRACT(YEAR FROM NOW())
    AND (p_city IS NULL OR l.city = p_city)
    AND (p_search IS NULL OR 
         p.full_name ILIKE '%' || p_search || '%' OR 
         p.display_name ILIKE '%' || p_search || '%')
  ORDER BY l.ranking_points DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- Recreate get_tournament_registration_priority with user_id
CREATE OR REPLACE FUNCTION public.get_tournament_registration_priority(tournament_uuid uuid)
 RETURNS TABLE(user_id uuid, registration_order integer, priority_score numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    tr.user_id,
    ROW_NUMBER() OVER (ORDER BY tr.created_at)::integer as registration_order,
    COALESCE(pr.elo_points, 1000)::numeric as priority_score
  FROM public.tournament_registrations tr
  LEFT JOIN public.player_rankings pr ON pr.user_id = tr.user_id
  WHERE tr.tournament_id = tournament_uuid
  AND tr.registration_status = 'confirmed'
  ORDER BY tr.created_at;
END;
$function$;

-- Recreate award_tournament_points with p_user_id parameter
CREATE OR REPLACE FUNCTION public.award_tournament_points(p_tournament_id uuid, p_user_id uuid, p_position integer, p_player_rank text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;