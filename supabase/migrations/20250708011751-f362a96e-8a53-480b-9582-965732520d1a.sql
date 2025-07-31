-- Fix the admin function to register test users to tournaments
CREATE OR REPLACE FUNCTION public.admin_register_test_users_to_tournament(
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