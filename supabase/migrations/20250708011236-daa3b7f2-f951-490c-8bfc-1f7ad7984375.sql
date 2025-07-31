-- Create dedicated test_profiles table for tournament testing
CREATE TABLE IF NOT EXISTS public.test_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  display_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'player',
  skill_level TEXT DEFAULT 'beginner',
  city TEXT DEFAULT 'Hồ Chí Minh',
  district TEXT DEFAULT 'Quận 1',
  bio TEXT DEFAULT 'Auto-generated test user for tournament testing',
  activity_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create test_player_rankings table for test users
CREATE TABLE IF NOT EXISTS public.test_player_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL UNIQUE REFERENCES test_profiles(user_id),
  elo INTEGER DEFAULT 1000,
  spa_points INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_player_rankings ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin access
CREATE POLICY "Admins can manage test profiles" 
ON public.test_profiles FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

CREATE POLICY "Admins can manage test rankings" 
ON public.test_player_rankings FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- Create updated admin function for test users
CREATE OR REPLACE FUNCTION public.admin_create_test_users_safe(user_data jsonb[])
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

  -- Process each user
  FOREACH user_record IN ARRAY user_data
  LOOP
    -- Generate fake UUID for test user
    fake_user_id := gen_random_uuid();
    
    -- Insert into test_profiles (no wallet triggers)
    INSERT INTO public.test_profiles (
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
      COALESCE(user_record->>'bio', 'Auto-generated test user for tournament testing'),
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
  
  RETURN jsonb_build_object(
    'success', true,
    'users', created_users,
    'count', array_length(created_users, 1)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to create test users: ' || SQLERRM
    );
END;
$$;