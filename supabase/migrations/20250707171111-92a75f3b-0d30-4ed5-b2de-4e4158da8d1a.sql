-- Fix get_tournament_registrations function to use correct column names
CREATE OR REPLACE FUNCTION public.get_tournament_registrations(tournament_uuid uuid)
 RETURNS TABLE(id uuid, user_id uuid, registration_date timestamp with time zone, status text, payment_status text, notes text, user_profile jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id,
    tr.player_id as user_id,  -- Use player_id but alias as user_id for compatibility
    tr.created_at as registration_date,
    tr.registration_status as status,
    tr.payment_status,
    tr.notes,
    jsonb_build_object(
      'user_id', p.user_id,
      'full_name', p.full_name,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url,
      'verified_rank', p.verified_rank,
      'current_rank', pr.current_rank_id
    ) as user_profile
  FROM public.tournament_registrations tr
  LEFT JOIN public.profiles p ON tr.player_id = p.user_id
  LEFT JOIN public.player_rankings pr ON tr.player_id = pr.player_id
  WHERE tr.tournament_id = tournament_uuid
  ORDER BY tr.created_at ASC;
END;
$function$