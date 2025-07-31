-- Fix the function to use proper schema paths
CREATE OR REPLACE FUNCTION public.add_third_place_match_to_existing_tournament(
  p_tournament_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_max_round INTEGER;
  v_semifinal_losers uuid[];
  v_existing_third_place INTEGER;
  v_third_place_match_id uuid;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Only process single elimination tournaments
  IF v_tournament.tournament_type != 'single_elimination' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only single elimination tournaments support third place matches');
  END IF;
  
  -- Check if third place match already exists
  SELECT COUNT(*) INTO v_existing_third_place
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id 
  AND is_third_place_match = true;
  
  IF v_existing_third_place > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Third place match already exists');
  END IF;
  
  -- Get max round (final round)
  SELECT MAX(round_number) INTO v_max_round
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
  AND NOT COALESCE(is_third_place_match, false);
  
  IF v_max_round < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament must have at least 2 rounds for third place match');
  END IF;
  
  -- Get semifinal losers (round before final)
  SELECT array_agg(
    CASE 
      WHEN winner_id = player1_id THEN player2_id 
      ELSE player1_id 
    END
  ) INTO v_semifinal_losers
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id 
  AND round_number = (v_max_round - 1)
  AND status = 'completed' 
  AND winner_id IS NOT NULL;
  
  -- Validate we have exactly 2 semifinal losers
  IF array_length(v_semifinal_losers, 1) != 2 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Cannot create third place match: need exactly 2 completed semifinal matches',
      'semifinal_losers_found', COALESCE(array_length(v_semifinal_losers, 1), 0)
    );
  END IF;
  
  -- Create third place match
  INSERT INTO tournament_matches (
    tournament_id, round_number, match_number, bracket_type,
    player1_id, player2_id, is_third_place_match, status, 
    created_at, updated_at
  ) VALUES (
    p_tournament_id, v_max_round, 99, 'third_place',
    v_semifinal_losers[1], v_semifinal_losers[2], true, 'scheduled',
    now(), now()
  ) RETURNING id INTO v_third_place_match_id;
  
  -- Update tournament to enable third place matches
  UPDATE tournaments 
  SET has_third_place_match = true, updated_at = now()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'third_place_match_id', v_third_place_match_id,
    'player1_id', v_semifinal_losers[1],
    'player2_id', v_semifinal_losers[2],
    'message', 'Third place match created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to create third place match: ' || SQLERRM
    );
END;
$$;

-- Now run it for test4
SELECT public.add_third_place_match_to_existing_tournament('00f7c452-e5a3-43dd-afa1-aa1966d3d43b');