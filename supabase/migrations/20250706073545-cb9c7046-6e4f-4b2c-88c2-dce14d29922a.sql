-- Check for any functions that might have ambiguous club_name references
-- Let's look at the update_club_stats function as it might be causing the issue

CREATE OR REPLACE FUNCTION public.update_club_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  club_id_var UUID;
  current_month INTEGER;
  current_year INTEGER;
BEGIN
  -- Get club ID from the triggering table
  IF TG_TABLE_NAME = 'rank_verifications' THEN
    club_id_var := COALESCE(NEW.club_id, OLD.club_id);
  ELSIF TG_TABLE_NAME = 'matches' THEN
    club_id_var := COALESCE(NEW.club_id, OLD.club_id);
  ELSIF TG_TABLE_NAME = 'tournaments' THEN
    club_id_var := COALESCE(NEW.club_id, OLD.club_id);
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF club_id_var IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Update or insert club stats with explicit table references
  INSERT INTO public.club_stats (
    club_id, 
    month, 
    year,
    verified_members,
    total_matches_hosted,
    active_members
  )
  VALUES (
    club_id_var,
    current_month,
    current_year,
    (SELECT COUNT(*) FROM public.rank_verifications rv WHERE rv.club_id = club_id_var AND rv.status = 'approved'),
    (SELECT COUNT(*) FROM public.matches m WHERE m.club_id = club_id_var AND EXTRACT(MONTH FROM m.created_at) = current_month),
    (SELECT COUNT(DISTINCT rv2.player_id) FROM public.rank_verifications rv2 WHERE rv2.club_id = club_id_var AND rv2.status = 'approved')
  )
  ON CONFLICT (club_id, month, year) 
  DO UPDATE SET
    verified_members = (SELECT COUNT(*) FROM public.rank_verifications rv3 WHERE rv3.club_id = club_id_var AND rv3.status = 'approved'),
    total_matches_hosted = (SELECT COUNT(*) FROM public.matches m2 WHERE m2.club_id = club_id_var AND EXTRACT(MONTH FROM m2.created_at) = current_month),
    active_members = (SELECT COUNT(DISTINCT rv4.player_id) FROM public.rank_verifications rv4 WHERE rv4.club_id = club_id_var AND rv4.status = 'approved'),
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$function$