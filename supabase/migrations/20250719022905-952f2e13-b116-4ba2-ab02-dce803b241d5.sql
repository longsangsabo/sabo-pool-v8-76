-- Function to manually trigger double elimination progression for all completed matches
CREATE OR REPLACE FUNCTION public.trigger_double_elimination_progression(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_result jsonb;
  v_processed_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors jsonb := '[]'::jsonb;
BEGIN
  -- Process all completed matches that haven't been progressed yet
  FOR v_match IN 
    SELECT 
      tm.id,
      tm.winner_id,
      CASE 
        WHEN tm.winner_id = tm.player1_id THEN tm.player2_id 
        ELSE tm.player1_id 
      END as loser_id,
      tm.round_number,
      tm.match_number,
      tm.bracket_type
    FROM tournament_matches tm
    WHERE tm.tournament_id = p_tournament_id
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
      AND tm.bracket_type IN ('winner', 'loser')
    ORDER BY tm.bracket_type ASC, tm.round_number ASC, tm.match_number ASC
  LOOP
    BEGIN
      -- Call the double elimination advancement function
      SELECT advance_double_elimination_winner(
        v_match.id,
        v_match.winner_id,
        v_match.loser_id
      ) INTO v_result;
      
      v_processed_count := v_processed_count + 1;
      
      RAISE NOTICE 'Processed match % (R% M% %): %', 
        v_match.id, v_match.round_number, v_match.match_number, v_match.bracket_type, v_result;
        
    EXCEPTION
      WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        v_errors := v_errors || jsonb_build_object(
          'match_id', v_match.id,
          'error', SQLERRM
        );
        RAISE NOTICE 'Error processing match %: %', v_match.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'processed_matches', v_processed_count,
    'error_count', v_error_count,
    'errors', v_errors,
    'message', format('Processed %s matches with %s errors', v_processed_count, v_error_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to trigger progression: ' || SQLERRM
    );
END;
$$;