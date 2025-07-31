-- Update the repair_double_elimination_bracket function to handle loser bracket scheduling
CREATE OR REPLACE FUNCTION public.repair_double_elimination_bracket(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_winner_result JSONB;
  v_loser_result JSONB;
  v_scheduling_result JSONB;
  v_total_fixed INTEGER := 0;
  v_total_scheduled INTEGER := 0;
BEGIN
  -- Step 1: Fix winner bracket progression
  SELECT public.fix_all_tournament_progression(p_tournament_id) INTO v_winner_result;
  
  -- Step 2: Reset and repair loser bracket
  SELECT public.reset_and_repair_loser_bracket(p_tournament_id) INTO v_loser_result;
  
  -- Step 3: Schedule matches that have both players assigned
  UPDATE tournament_matches 
  SET status = 'scheduled', updated_at = NOW()
  WHERE tournament_id = p_tournament_id
    AND bracket_type = 'loser'
    AND status = 'pending'
    AND player1_id IS NOT NULL 
    AND player2_id IS NOT NULL;
    
  GET DIAGNOSTICS v_total_scheduled = ROW_COUNT;
  
  -- Count total fixes
  v_total_fixed := COALESCE((v_winner_result->>'fixed_matches')::INTEGER, 0) + 
                   COALESCE((v_loser_result->>'successful_losers')::INTEGER, 0);
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'winner_bracket_result', v_winner_result,
    'loser_bracket_result', v_loser_result,
    'matches_scheduled', v_total_scheduled,
    'total_fixes', v_total_fixed,
    'repair_summary', format('Fixed %s advancements, scheduled %s loser matches', v_total_fixed, v_total_scheduled),
    'repaired_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;