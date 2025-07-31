-- Create a fixed version of update_club_stats function
-- This function removes references to non-existent tables and columns
CREATE OR REPLACE FUNCTION public.update_club_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  club_record RECORD;
  current_month INTEGER := EXTRACT(MONTH FROM NOW());
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
BEGIN
  -- Update stats for all clubs
  FOR club_record IN SELECT id FROM public.club_profiles WHERE deleted_at IS NULL
  LOOP
    -- Insert or update club stats with basic data only
    INSERT INTO public.club_stats (
      club_id, 
      month, 
      year,
      total_matches_hosted,
      active_members,
      verified_members
    )
    VALUES (
      club_record.id,
      current_month,
      current_year,
      (SELECT COUNT(*) FROM public.matches m WHERE m.club_id = club_record.id AND EXTRACT(MONTH FROM m.created_at) = current_month),
      0, -- Will be updated when we have member tracking
      0  -- Will be updated when we have verification system
    )
    ON CONFLICT (club_id, month, year) 
    DO UPDATE SET
      total_matches_hosted = (SELECT COUNT(*) FROM public.matches m2 WHERE m2.club_id = club_record.id AND EXTRACT(MONTH FROM m2.created_at) = current_month),
      updated_at = NOW();
  END LOOP;
  
  RAISE NOTICE 'Club stats updated successfully';
END;
$$;