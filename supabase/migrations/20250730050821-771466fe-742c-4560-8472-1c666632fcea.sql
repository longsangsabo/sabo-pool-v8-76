-- Phase 2 & 3: Verify current system and enhance real player integration

-- 1. Test and verify the create_tournament_from_double1_template function
CREATE OR REPLACE FUNCTION public.test_double1_template_creation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_test_tournament_id uuid;
  v_template_result jsonb;
  v_match_count integer;
  v_structure_analysis jsonb;
BEGIN
  -- Create a test tournament ID
  v_test_tournament_id := gen_random_uuid();
  
  -- Test the template creation with empty player array
  SELECT create_tournament_from_double1_template(
    v_test_tournament_id, 
    ARRAY[]::uuid[]
  ) INTO v_template_result;
  
  -- Analyze the created structure
  SELECT COUNT(*) INTO v_match_count
  FROM tournament_matches 
  WHERE tournament_id = v_test_tournament_id;
  
  -- Get structure breakdown by round
  SELECT jsonb_agg(
    jsonb_build_object(
      'round', round_number,
      'matches', match_count,
      'status', match_status
    ) ORDER BY round_number
  ) INTO v_structure_analysis
  FROM (
    SELECT 
      round_number,
      COUNT(*) as match_count,
      STRING_AGG(DISTINCT status, ', ') as match_status
    FROM tournament_matches 
    WHERE tournament_id = v_test_tournament_id
    GROUP BY round_number
  ) rounds;
  
  -- Clean up test data
  DELETE FROM tournament_matches WHERE tournament_id = v_test_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'template_result', v_template_result,
    'total_matches_created', v_match_count,
    'structure_analysis', v_structure_analysis,
    'matches_double1_expected', 27,
    'structure_valid', v_match_count = 27
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Clean up on error
    DELETE FROM tournament_matches WHERE tournament_id = v_test_tournament_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 2. Function to replace dummy players with real registrations
CREATE OR REPLACE FUNCTION public.replace_dummy_players_with_registrations(
  p_tournament_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registration record;
  v_dummy_players uuid[];
  v_real_players uuid[];
  v_replacements_made integer := 0;
  v_round1_matches record;
BEGIN
  -- Get confirmed registrations for this tournament
  SELECT array_agg(user_id ORDER BY created_at) INTO v_real_players
  FROM tournament_registrations 
  WHERE tournament_id = p_tournament_id 
  AND registration_status = 'confirmed'
  LIMIT 16; -- Double elimination supports max 16 players
  
  -- If we don't have enough real players, return error
  IF array_length(v_real_players, 1) < 2 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Need at least 2 confirmed registrations',
      'confirmed_count', COALESCE(array_length(v_real_players, 1), 0)
    );
  END IF;
  
  -- Get dummy players from Round 1 matches
  SELECT array_agg(DISTINCT player_id) INTO v_dummy_players
  FROM (
    SELECT player1_id as player_id FROM tournament_matches 
    WHERE tournament_id = p_tournament_id AND round_number = 1
    UNION
    SELECT player2_id as player_id FROM tournament_matches 
    WHERE tournament_id = p_tournament_id AND round_number = 1
  ) all_players
  WHERE player_id IS NOT NULL;
  
  -- Replace dummy players in Round 1 matches with real players
  FOR v_round1_matches IN
    SELECT * FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND round_number = 1 
    AND (player1_id IS NOT NULL OR player2_id IS NOT NULL)
    ORDER BY match_number
  LOOP
    -- Replace player1 if it's a dummy and we have real players
    IF v_round1_matches.player1_id = ANY(v_dummy_players) 
       AND v_replacements_made < array_length(v_real_players, 1) THEN
      
      UPDATE tournament_matches 
      SET player1_id = v_real_players[v_replacements_made + 1],
          updated_at = NOW()
      WHERE id = v_round1_matches.id;
      
      v_replacements_made := v_replacements_made + 1;
    END IF;
    
    -- Replace player2 if it's a dummy and we have real players
    IF v_round1_matches.player2_id = ANY(v_dummy_players) 
       AND v_replacements_made < array_length(v_real_players, 1) THEN
      
      UPDATE tournament_matches 
      SET player2_id = v_real_players[v_replacements_made + 1],
          updated_at = NOW()
      WHERE id = v_round1_matches.id;
      
      v_replacements_made := v_replacements_made + 1;
    END IF;
  END LOOP;
  
  -- Update match status to 'scheduled' for matches with both players
  UPDATE tournament_matches 
  SET status = 'scheduled', updated_at = NOW()
  WHERE tournament_id = p_tournament_id 
  AND round_number = 1
  AND player1_id IS NOT NULL 
  AND player2_id IS NOT NULL
  AND status = 'pending';
  
  RETURN jsonb_build_object(
    'success', true,
    'real_players_available', array_length(v_real_players, 1),
    'replacements_made', v_replacements_made,
    'dummy_players_found', array_length(v_dummy_players, 1),
    'round1_matches_ready', (
      SELECT COUNT(*) FROM tournament_matches 
      WHERE tournament_id = p_tournament_id 
      AND round_number = 1 
      AND player1_id IS NOT NULL 
      AND player2_id IS NOT NULL
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 3. Function to validate tournament structure matches Double1
CREATE OR REPLACE FUNCTION public.validate_tournament_structure_against_double1(
  p_tournament_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_structure_analysis jsonb;
  v_double1_structure jsonb := '[
    {"round": 1, "expected_matches": 8},
    {"round": 2, "expected_matches": 4}, 
    {"round": 3, "expected_matches": 2},
    {"round": 101, "expected_matches": 4},
    {"round": 102, "expected_matches": 2},
    {"round": 103, "expected_matches": 1},
    {"round": 201, "expected_matches": 2},
    {"round": 202, "expected_matches": 1},
    {"round": 250, "expected_matches": 2},
    {"round": 300, "expected_matches": 1}
  ]'::jsonb;
  v_validation_results jsonb[] := '{}';
  v_round_spec jsonb;
  v_actual_count integer;
  v_expected_count integer;
  v_is_valid boolean := true;
BEGIN
  -- Check each round specification
  FOR v_round_spec IN SELECT * FROM jsonb_array_elements(v_double1_structure)
  LOOP
    v_expected_count := (v_round_spec->>'expected_matches')::integer;
    
    SELECT COUNT(*) INTO v_actual_count
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND round_number = (v_round_spec->>'round')::integer;
    
    IF v_actual_count != v_expected_count THEN
      v_is_valid := false;
    END IF;
    
    v_validation_results := v_validation_results || jsonb_build_object(
      'round', v_round_spec->>'round',
      'expected_matches', v_expected_count,
      'actual_matches', v_actual_count,
      'valid', v_actual_count = v_expected_count
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'tournament_id', p_tournament_id,
    'structure_valid', v_is_valid,
    'total_matches', (
      SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = p_tournament_id
    ),
    'expected_total', 27,
    'round_analysis', v_validation_results
  );
END;
$$;

-- 4. Comprehensive tournament setup function that combines everything
CREATE OR REPLACE FUNCTION public.setup_complete_double1_tournament(
  p_tournament_id uuid,
  p_auto_replace_players boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template_result jsonb;
  v_structure_validation jsonb;
  v_player_replacement jsonb;
  v_final_status jsonb;
BEGIN
  -- Step 1: Create Double1 template structure
  SELECT create_tournament_from_double1_template(
    p_tournament_id,
    ARRAY[]::uuid[] -- Start with empty array, will replace with real players
  ) INTO v_template_result;
  
  IF NOT (v_template_result->>'success')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to create Double1 template',
      'template_result', v_template_result
    );
  END IF;
  
  -- Step 2: Validate structure
  SELECT validate_tournament_structure_against_double1(p_tournament_id) INTO v_structure_validation;
  
  -- Step 3: Replace dummy players with real registrations if requested
  IF p_auto_replace_players THEN
    SELECT replace_dummy_players_with_registrations(p_tournament_id) INTO v_player_replacement;
  ELSE
    v_player_replacement := jsonb_build_object('skipped', true);
  END IF;
  
  -- Step 4: Final status check
  SELECT jsonb_build_object(
    'tournament_ready', (
      SELECT COUNT(*) FROM tournament_matches 
      WHERE tournament_id = p_tournament_id 
      AND round_number = 1 
      AND status IN ('scheduled', 'in_progress')
    ) > 0,
    'round1_matches_with_players', (
      SELECT COUNT(*) FROM tournament_matches 
      WHERE tournament_id = p_tournament_id 
      AND round_number = 1 
      AND player1_id IS NOT NULL 
      AND player2_id IS NOT NULL
    )
  ) INTO v_final_status;
  
  RETURN jsonb_build_object(
    'success', true,
    'template_creation', v_template_result,
    'structure_validation', v_structure_validation,
    'player_replacement', v_player_replacement,
    'final_status', v_final_status,
    'ready_to_start', (v_final_status->>'tournament_ready')::boolean
  );
END;
$$;