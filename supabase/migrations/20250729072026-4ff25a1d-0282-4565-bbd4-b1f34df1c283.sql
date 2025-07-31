-- Fix auto_advance_to_final function - GROUP BY issue
CREATE OR REPLACE FUNCTION public.auto_advance_to_final(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_semifinal_matches RECORD[];
  v_final_match RECORD;
  v_final_created INTEGER := 0;
  v_final_match_exists BOOLEAN := FALSE;
  v_grand_final_winner UUID;
  v_grand_final_loser UUID;
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
  
  -- Get semifinals winners (both should be completed)
  SELECT array_agg(ROW(winner_id, match_number, id)::RECORD) INTO v_semifinal_matches
  FROM tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = 250 
    AND status = 'completed' 
    AND winner_id IS NOT NULL;
  
  -- Check if we have exactly 2 semifinal winners
  IF array_length(v_semifinal_matches, 1) != 2 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', format('Need exactly 2 completed semifinals, found %s', 
        COALESCE(array_length(v_semifinal_matches, 1), 0))
    );
  END IF;
  
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
    (v_semifinal_matches[1]).winner_id,
    (v_semifinal_matches[2]).winner_id,
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
      'semifinal_winners', array[
        (v_semifinal_matches[1]).winner_id,
        (v_semifinal_matches[2]).winner_id
      ],
      'final_round', 300
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'final_matches_created', v_final_created,
    'semifinal_winners', array[
      (v_semifinal_matches[1]).winner_id,
      (v_semifinal_matches[2]).winner_id
    ],
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