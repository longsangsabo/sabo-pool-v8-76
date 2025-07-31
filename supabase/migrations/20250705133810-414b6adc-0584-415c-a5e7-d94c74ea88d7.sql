-- Create function to delete all club data
CREATE OR REPLACE FUNCTION public.delete_club_completely(club_profile_id uuid, admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  club_record RECORD;
  result JSON;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = admin_id 
    AND is_admin = true
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Get club details before deletion
  SELECT * INTO club_record 
  FROM public.club_profiles 
  WHERE id = club_profile_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Club not found');
  END IF;
  
  -- Delete all related data in correct order
  -- Delete club stats
  DELETE FROM public.club_stats WHERE club_id = club_profile_id;
  
  -- Delete club accountability records
  DELETE FROM public.club_accountability WHERE club_id = club_profile_id;
  
  -- Delete rank verifications related to this club
  DELETE FROM public.rank_verifications WHERE club_id = club_profile_id;
  
  -- Delete rank adjustments related to this club
  DELETE FROM public.rank_adjustments WHERE club_id = club_profile_id;
  
  -- Delete challenges related to this club
  DELETE FROM public.challenges WHERE club_id = club_profile_id;
  
  -- Delete matches related to this club
  DELETE FROM public.matches WHERE club_id = club_profile_id;
  
  -- Delete memberships
  DELETE FROM public.memberships WHERE club_id = club_profile_id;
  
  -- Delete club registration
  DELETE FROM public.club_registrations WHERE user_id = club_record.user_id;
  
  -- Finally delete club profile
  DELETE FROM public.club_profiles WHERE id = club_profile_id;
  
  -- Reset user role back to player
  UPDATE public.profiles 
  SET 
    role = 'player',
    active_role = 'player',
    club_id = NULL,
    updated_at = now()
  WHERE user_id = club_record.user_id;
  
  -- Log admin action
  INSERT INTO public.admin_actions (
    admin_id, 
    action_type, 
    target_user_id, 
    action_details,
    reason
  ) VALUES (
    admin_id,
    'delete_club',
    club_record.user_id,
    jsonb_build_object(
      'club_id', club_profile_id,
      'club_name', club_record.club_name,
      'deleted_at', now()
    ),
    'Complete club deletion by admin'
  );
  
  RETURN json_build_object(
    'success', true,
    'club_name', club_record.club_name,
    'message', 'Club and all related data deleted successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;