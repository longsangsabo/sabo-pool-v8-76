-- Create admin function to safely create test users without wallet triggers
CREATE OR REPLACE FUNCTION public.admin_create_test_users(user_data jsonb[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_record jsonb;
  created_users jsonb[] := '{}';
  fake_user_id uuid;
  result_user jsonb;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    RETURN jsonb_build_object('error', 'Unauthorized: Admin access required');
  END IF;

  -- Disable triggers temporarily to prevent wallet creation
  SET session_replication_role = replica;
  
  -- Process each user
  FOREACH user_record IN ARRAY user_data
  LOOP
    -- Generate fake UUID for test user
    fake_user_id := gen_random_uuid();
    
    -- Insert profile directly, bypassing any triggers
    INSERT INTO public.profiles (
      user_id, phone, full_name, display_name, role, skill_level,
      city, district, bio, activity_status, created_at, updated_at
    ) VALUES (
      fake_user_id,
      user_record->>'phone',
      user_record->>'full_name', 
      user_record->>'display_name',
      COALESCE(user_record->>'role', 'player'),
      COALESCE(user_record->>'skill_level', 'beginner'),
      COALESCE(user_record->>'city', 'Hồ Chí Minh'),
      COALESCE(user_record->>'district', 'Quận 1'),
      COALESCE(user_record->>'bio', 'Auto-generated test user - NO WALLET'),
      COALESCE(user_record->>'activity_status', 'active'),
      now(),
      now()
    );
    
    -- Build result user object
    result_user := jsonb_build_object(
      'user_id', fake_user_id,
      'full_name', user_record->>'full_name',
      'phone', user_record->>'phone'
    );
    
    created_users := created_users || result_user;
  END LOOP;
  
  -- Re-enable triggers
  SET session_replication_role = DEFAULT;
  
  RETURN jsonb_build_object(
    'success', true,
    'users', created_users,
    'count', array_length(created_users, 1)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Re-enable triggers even on error
    SET session_replication_role = DEFAULT;
    RETURN jsonb_build_object(
      'error', 'Failed to create test users: ' || SQLERRM
    );
END;
$$;