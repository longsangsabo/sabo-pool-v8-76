-- Update the general repair function to use comprehensive advancement
CREATE OR REPLACE FUNCTION public.repair_double_elimination_bracket(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tournament RECORD;
  v_repair_result JSONB;
  v_advancement_count INTEGER := 0;
  v_match RECORD;
  v_next_match RECORD;
  v_loser_id UUID;
  v_created_matches INTEGER := 0;
  v_fixed_advancements INTEGER := 0;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  IF v_tournament.tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('error', 'This repair function is only for double elimination tournaments');
  END IF;
  
  -- Step 1: Data cleanup - fix duplicate players
  UPDATE tournament_matches 
  SET player2_id = NULL,
      status = 'pending'
  WHERE tournament_id = p_tournament_id
    AND player1_id = player2_id;
  
  -- Step 2: Fix status inconsistencies
  UPDATE tournament_matches 
  SET status = 'completed'
  WHERE tournament_id = p_tournament_id
    AND status = 'scheduled' 
    AND winner_id IS NOT NULL;
  
  -- Step 3: Use comprehensive advancement for all completed matches
  FOR v_match IN
    SELECT * FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND status = 'completed' 
    AND winner_id IS NOT NULL
    ORDER BY bracket_type, round_number, match_number
  LOOP
    -- Try to advance using the comprehensive function
    BEGIN
      SELECT public.advance_double_elimination_winner_comprehensive(v_match.id) INTO v_repair_result;
      
      IF v_repair_result->>'success' = 'true' AND COALESCE((v_repair_result->>'advancements')::integer, 0) > 0 THEN
        v_fixed_advancements := v_fixed_advancements + 1;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but continue
        RAISE NOTICE 'Failed to advance winner for match %: %', v_match.id, SQLERRM;
    END;
  END LOOP;
  
  -- Step 4: Update match statuses to be consistent
  UPDATE tournament_matches 
  SET status = 'scheduled'
  WHERE tournament_id = p_tournament_id
    AND status = 'pending'
    AND player1_id IS NOT NULL 
    AND player2_id IS NOT NULL;
  
  -- Step 5: Log repair activity
  INSERT INTO tournament_automation_log (
    tournament_id,
    automation_type,
    status,
    details,
    completed_at
  ) VALUES (
    p_tournament_id,
    'bracket_repair_comprehensive',
    'completed',
    jsonb_build_object(
      'fixed_advancements', v_fixed_advancements,
      'created_matches', v_created_matches,
      'repair_type', 'double_elimination_comprehensive',
      'tournament_name', v_tournament.name
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'tournament_name', v_tournament.name,
    'fixed_advancements', v_fixed_advancements,
    'created_matches', v_created_matches,
    'repair_summary', format('Fixed %s advancements and created %s matches using comprehensive repair', v_fixed_advancements, v_created_matches),
    'repaired_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Comprehensive bracket repair failed: %s', SQLERRM),
      'tournament_id', p_tournament_id
    );
END;
$$;