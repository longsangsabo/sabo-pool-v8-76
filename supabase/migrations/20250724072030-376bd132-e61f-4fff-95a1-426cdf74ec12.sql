-- Create function to reset and repair loser bracket
CREATE OR REPLACE FUNCTION public.reset_and_repair_loser_bracket(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_loser_id UUID;
  v_loser_result JSONB;
  v_total_losers INTEGER := 0;
  v_successful_losers INTEGER := 0;
  v_errors TEXT[] := '{}';
BEGIN
  -- Step 1: Clear all loser bracket assignments
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, winner_id = NULL, status = 'pending', updated_at = NOW()
  WHERE tournament_id = p_tournament_id 
    AND bracket_type = 'loser';
  
  -- Step 2: Process all completed winner bracket matches to advance losers
  FOR v_match IN
    SELECT * FROM tournament_matches 
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'winner'
      AND status = 'completed'
      AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    BEGIN
      -- Determine loser
      v_loser_id := CASE 
        WHEN v_match.winner_id = v_match.player1_id THEN v_match.player2_id 
        ELSE v_match.player1_id 
      END;
      
      IF v_loser_id IS NOT NULL THEN
        v_total_losers := v_total_losers + 1;
        
        -- Try to advance loser
        SELECT public.advance_double_elimination_loser(v_match.id, v_loser_id) INTO v_loser_result;
        
        IF (v_loser_result->>'success')::boolean THEN
          v_successful_losers := v_successful_losers + 1;
        ELSE
          v_errors := v_errors || (format('Match %s Round %s: %s', 
                                         v_match.match_number, v_match.round_number, 
                                         v_loser_result->>'error'));
        END IF;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || (format('Match %s Round %s: %s', 
                                       v_match.match_number, v_match.round_number, SQLERRM));
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'total_losers', v_total_losers,
    'successful_losers', v_successful_losers,
    'failed_losers', v_total_losers - v_successful_losers,
    'errors', v_errors,
    'reset_and_repaired_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;