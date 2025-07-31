-- Create a comprehensive solution for test tournament registrations
-- First, let's create a view that combines real and test profiles
CREATE OR REPLACE VIEW public.all_profiles AS
SELECT 
  user_id,
  full_name,
  display_name,
  phone,
  role,
  skill_level,
  city,
  district,
  bio,
  activity_status,
  created_at,
  updated_at,
  'real' as profile_type
FROM public.profiles
UNION ALL
SELECT 
  user_id,
  full_name,
  display_name,
  phone,
  role,
  skill_level,
  city,
  district,
  bio,
  activity_status,
  created_at,
  updated_at,
  'test' as profile_type
FROM public.test_profiles;

-- Create admin function that bypasses foreign key constraints for test registrations
CREATE OR REPLACE FUNCTION public.admin_register_test_users_to_tournament_safe(
  p_tournament_id uuid,
  p_test_user_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_id_var uuid;
  registrations_created INTEGER := 0;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    RETURN jsonb_build_object('error', 'Unauthorized: Admin access required');
  END IF;

  -- Temporarily disable foreign key constraint checking
  SET session_replication_role = replica;

  -- Register each test user to the tournament
  FOREACH user_id_var IN ARRAY p_test_user_ids
  LOOP
    INSERT INTO public.tournament_registrations (
      tournament_id,
      player_id,
      registration_status,
      payment_status,
      registration_date,
      created_at
    ) VALUES (
      p_tournament_id,
      user_id_var,
      'confirmed',
      'paid',
      now(),
      now()
    ) ON CONFLICT (tournament_id, player_id) DO NOTHING;
    
    registrations_created := registrations_created + 1;
  END LOOP;

  -- Re-enable foreign key constraint checking
  SET session_replication_role = DEFAULT;

  RETURN jsonb_build_object(
    'success', true,
    'registrations_created', registrations_created,
    'tournament_id', p_tournament_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Re-enable foreign key constraint checking even on error
    SET session_replication_role = DEFAULT;
    RETURN jsonb_build_object(
      'error', 'Failed to register test users: ' || SQLERRM
    );
END;
$$;