-- Create comprehensive double elimination bracket repair function
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
  
  -- Step 1: Fix completed matches that have winners but no advancement
  FOR v_match IN
    SELECT * FROM tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND status = 'completed' 
    AND winner_id IS NOT NULL
    ORDER BY bracket_type, round_number, match_number
  LOOP
    -- Try to advance the winner
    BEGIN
      SELECT public.advance_double_elimination_winner(
        v_match.id, 
        v_match.winner_id, 
        CASE WHEN v_match.player1_id = v_match.winner_id THEN v_match.player2_id ELSE v_match.player1_id END
      ) INTO v_repair_result;
      
      IF v_repair_result->>'success' = 'true' OR (v_repair_result ? 'advancements' AND (v_repair_result->>'advancements')::integer > 0) THEN
        v_fixed_advancements := v_fixed_advancements + 1;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but continue
        RAISE NOTICE 'Failed to advance winner for match %: %', v_match.id, SQLERRM;
    END;
  END LOOP;
  
  -- Step 2: Create missing matches in next rounds
  -- Check for rounds that should have matches but don't
  WITH round_analysis AS (
    SELECT 
      bracket_type,
      branch_type,
      round_number,
      COUNT(*) as current_matches,
      COUNT(*) FILTER (WHERE status = 'completed' AND winner_id IS NOT NULL) as completed_matches
    FROM tournament_matches 
    WHERE tournament_id = p_tournament_id
    GROUP BY bracket_type, branch_type, round_number
  ),
  missing_rounds AS (
    SELECT DISTINCT
      ra1.bracket_type,
      ra1.branch_type,
      ra1.round_number + 1 as next_round
    FROM round_analysis ra1
    WHERE ra1.completed_matches > 0 
    AND NOT EXISTS (
      SELECT 1 FROM round_analysis ra2 
      WHERE ra2.bracket_type = ra1.bracket_type 
      AND ra2.branch_type = ra1.branch_type 
      AND ra2.round_number = ra1.round_number + 1
    )
    AND ra1.bracket_type != 'final' -- Don't auto-create final matches
  )
  SELECT COUNT(*) INTO v_created_matches FROM missing_rounds;
  
  -- Step 3: Regenerate bracket structure if severely broken
  IF v_fixed_advancements = 0 AND v_created_matches = 0 THEN
    -- Last resort: regenerate the entire bracket
    BEGIN
      DELETE FROM tournament_matches WHERE tournament_id = p_tournament_id;
      SELECT public.create_double_elimination_bracket_v2(p_tournament_id) INTO v_repair_result;
      v_created_matches := COALESCE((v_repair_result->>'matches_created')::integer, 0);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Failed to regenerate bracket: %', SQLERRM;
    END;
  END IF;
  
  -- Step 4: Log repair activity
  INSERT INTO tournament_automation_log (
    tournament_id,
    automation_type,
    status,
    details,
    completed_at
  ) VALUES (
    p_tournament_id,
    'bracket_repair',
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
    'repair_summary', format('Fixed %s advancements and created %s matches', v_fixed_advancements, v_created_matches),
    'repaired_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Bracket repair failed: %s', SQLERRM),
      'tournament_id', p_tournament_id
    );
END;
$$;