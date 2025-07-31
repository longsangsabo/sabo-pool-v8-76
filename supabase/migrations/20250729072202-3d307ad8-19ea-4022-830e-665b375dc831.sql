-- Final fix for auto_advance_to_final function 
CREATE OR REPLACE FUNCTION public.auto_advance_to_final(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_semifinal_winner1 UUID;
  v_semifinal_winner2 UUID;
  v_final_created INTEGER := 0;
  v_final_match_exists BOOLEAN := FALSE;
  v_semifinal_count INTEGER := 0;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Check if final match already exists
  SELECT EXISTS(
    SELECT 1 FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND round_number = 300
  ) INTO v_final_match_exists;
  
  IF v_final_match_exists THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Final match already exists'
    );
  END IF;
  
  -- Count completed semifinals
  SELECT COUNT(*) INTO v_semifinal_count
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = 250 
    AND status = 'completed' 
    AND winner_id IS NOT NULL;
  
  -- Check if we have exactly 2 semifinal winners
  IF v_semifinal_count != 2 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', format('Need exactly 2 completed semifinals, found %s', v_semifinal_count)
    );
  END IF;
  
  -- Get the first semifinal winner
  SELECT winner_id INTO v_semifinal_winner1
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = 250 
    AND status = 'completed' 
    AND winner_id IS NOT NULL
    AND match_number = 1;
  
  -- Get the second semifinal winner
  SELECT winner_id INTO v_semifinal_winner2
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = 250 
    AND status = 'completed' 
    AND winner_id IS NOT NULL
    AND match_number = 2;
  
  -- Create the Grand Final (Round 300)
  INSERT INTO tournament_matches (
    tournament_id,
    round_number,
    match_number,
    player1_id,
    player2_id,
    status,
    bracket_type,
    match_stage,
    created_at,
    updated_at
  ) VALUES (
    p_tournament_id,
    300, -- Grand Final round
    1,   -- Only one final match
    v_semifinal_winner1,
    v_semifinal_winner2,
    'scheduled',
    'single_elimination',
    'final',
    NOW(),
    NOW()
  );
  
  v_final_created := 1;
  
  -- Log the automation
  INSERT INTO tournament_automation_log (
    tournament_id,
    automation_type,
    status,
    details,
    completed_at
  ) VALUES (
    p_tournament_id,
    'auto_advance_to_final',
    'completed',
    jsonb_build_object(
      'final_matches_created', v_final_created,
      'semifinal_winner1', v_semifinal_winner1,
      'semifinal_winner2', v_semifinal_winner2,
      'final_round', 300
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'final_matches_created', v_final_created,
    'semifinal_winners', array[v_semifinal_winner1, v_semifinal_winner2],
    'message', format('Created %s final match successfully', v_final_created)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO tournament_automation_log (
      tournament_id,
      automation_type,
      status,
      error_message,
      details
    ) VALUES (
      p_tournament_id,
      'auto_advance_to_final',
      'failed',
      SQLERRM,
      jsonb_build_object('error_detail', SQLERRM)
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Test the final auto advancement
SELECT public.auto_advance_to_final('8930cca2-d347-4be6-99d5-8a5b463f1455');