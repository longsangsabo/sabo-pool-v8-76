-- Fix the test function with correct column names
CREATE OR REPLACE FUNCTION public.test_new_sabo_tournament_creation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id uuid;
  v_result jsonb;
  v_compliance_result jsonb;
BEGIN
  -- Create a test tournament
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
    'Test SABO Fix Tournament',
    'Testing SABO Double1 pattern implementation',
    'double_elimination',
    16,
    'upcoming',
    (SELECT user_id FROM profiles WHERE is_admin = true LIMIT 1),
    'Test Venue, District 1, Ho Chi Minh City',
    NOW(),
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '3 days'
  ) RETURNING id INTO v_tournament_id;

  -- Generate SABO bracket with elo ranking
  SELECT generate_sabo_tournament_bracket(v_tournament_id, 'elo_ranking') INTO v_result;
  
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
    'test_tournament_id', v_tournament_id,
    'bracket_generation_result', v_result,
    'compliance_verification', v_compliance_result,
    'test_time', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'test_tournament_id', v_tournament_id
    );
END;
$$;