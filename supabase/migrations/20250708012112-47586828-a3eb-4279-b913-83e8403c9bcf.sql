-- Create dedicated test tournament registrations table without foreign key constraints
CREATE TABLE IF NOT EXISTS public.test_tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL,
  player_id UUID NOT NULL, -- No foreign key constraint to allow test users
  registration_status TEXT DEFAULT 'confirmed',
  payment_status TEXT DEFAULT 'paid',
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Unique constraint to prevent duplicate registrations
  UNIQUE(tournament_id, player_id)
);

-- Enable RLS
ALTER TABLE public.test_tournament_registrations ENABLE ROW LEVEL SECURITY;

-- RLS policy for admin access
CREATE POLICY "Admins can manage test tournament registrations" 
ON public.test_tournament_registrations FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- Create simple admin function to register test users using the test table
CREATE OR REPLACE FUNCTION public.admin_register_test_users_to_tournament_final(
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

  -- Register each test user to the tournament in the test table
  FOREACH user_id_var IN ARRAY p_test_user_ids
  LOOP
    INSERT INTO public.test_tournament_registrations (
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

  RETURN jsonb_build_object(
    'success', true,
    'registrations_created', registrations_created,
    'tournament_id', p_tournament_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to register test users: ' || SQLERRM
    );
END;
$$;