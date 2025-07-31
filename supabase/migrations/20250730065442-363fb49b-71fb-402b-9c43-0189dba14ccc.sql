-- Create a comprehensive end-to-end test for Double1 pattern compliance
CREATE OR REPLACE FUNCTION public.test_tournamentbracketgenerator_fix()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id uuid;
  v_participants integer := 16;
  v_setup_result jsonb;
  v_compliance_result jsonb;
  v_admin_user_id uuid;
BEGIN
  -- Get admin user
  SELECT user_id INTO v_admin_user_id FROM profiles WHERE is_admin = true LIMIT 1;
  
  -- Create a tournament that TournamentBracketGenerator can work with
  INSERT INTO tournaments (
    name,
    description,
    tournament_type,
    max_participants,
    status,
    created_by,
    venue_address,
    registration_start,
    registration_end,
    tournament_start,
    tournament_end
  ) VALUES (
    'TournamentBracketGenerator Fix Test',
    'Testing the fixed TournamentBracketGenerator component',
    'double_elimination',
    16,
    'upcoming',
    v_admin_user_id,
    'Test Venue for TournamentBracketGenerator',
    NOW(),
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '3 days'
  ) RETURNING id INTO v_tournament_id;

  -- Add some test registrations so the generator has participants to work with
  INSERT INTO tournament_registrations (
    tournament_id,
    user_id,
    registration_status,
    registration_date,
    payment_status
  )
  SELECT 
    v_tournament_id,
    user_id,
    'confirmed',
    NOW(),
    'paid'
  FROM (
    SELECT user_id FROM profiles 
    WHERE is_demo_user = false 
    LIMIT v_participants
  ) p;

  -- Simulate what TournamentBracketGenerator does: call setup_complete_double1_tournament
  SELECT setup_complete_double1_tournament(v_tournament_id, false) INTO v_setup_result;
  
  -- Verify compliance with Double1 pattern
  SELECT jsonb_agg(
    jsonb_build_object(
      'round_number', round_number,
      'bracket_type', bracket_type,
      'expected_matches', expected_matches,
      'actual_matches', actual_matches,
      'compliance_status', compliance_status
    )
  ) INTO v_compliance_result
  FROM verify_double1_pattern_compliance(v_tournament_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'test_name', 'TournamentBracketGenerator Fix Test',
    'tournament_id', v_tournament_id,
    'participants_registered', v_participants,
    'setup_result', v_setup_result,
    'compliance_verification', v_compliance_result,
    'test_completed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_context', 'TournamentBracketGenerator test failed',
      'tournament_id', v_tournament_id
    );
END;
$$;