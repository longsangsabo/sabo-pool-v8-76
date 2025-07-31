-- Reset broken tournaments and re-trigger advancement
CREATE OR REPLACE FUNCTION public.reset_broken_sabo_tournaments()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament record;
  v_match record;
  v_reset_count INTEGER := 0;
  v_advancement_count INTEGER := 0;
  v_results jsonb[] := '{}';
  v_advancement_result jsonb;
BEGIN
  -- Find tournaments with advancement issues (TBD players in later rounds with completed Round 1 matches)
  FOR v_tournament IN
    SELECT DISTINCT t.id, t.name
    FROM tournaments t
    JOIN tournament_matches tm1 ON t.id = tm1.tournament_id
    WHERE t.tournament_type = 'double_elimination'
      AND t.status IN ('ongoing', 'registration_closed')
      AND t.created_at > NOW() - INTERVAL '2 days'
      AND EXISTS (
        -- Has completed Round 1 matches
        SELECT 1 FROM tournament_matches tm_r1 
        WHERE tm_r1.tournament_id = t.id
          AND tm_r1.round_number = 1 
          AND tm_r1.status = 'completed'
          AND tm_r1.winner_id IS NOT NULL
      )
      AND EXISTS (
        -- Has empty Round 2+ matches that should have players
        SELECT 1 FROM tournament_matches tm_r2 
        WHERE tm_r2.tournament_id = t.id
          AND tm_r2.round_number > 1 
          AND tm_r2.player1_id IS NULL 
          AND tm_r2.player2_id IS NULL
      )
  LOOP
    RAISE NOTICE 'Resetting broken tournament: % (%)', v_tournament.name, v_tournament.id;
    
    -- Reset matches in Round 2+ that don't have players
    UPDATE tournament_matches 
    SET 
      player1_id = NULL,
      player2_id = NULL,
      status = 'pending',
      player1_score = NULL,
      player2_score = NULL,
      winner_id = NULL,
      updated_at = NOW()
    WHERE tournament_id = v_tournament.id
      AND round_number > 1 
      AND (player1_id IS NULL OR player2_id IS NULL);
    
    v_reset_count := v_reset_count + 1;
    
    -- Re-trigger advancement for completed Round 1 matches
    FOR v_match IN
      SELECT tm.id, tm.tournament_id, tm.winner_id 
      FROM tournament_matches tm
      WHERE tm.tournament_id = v_tournament.id
        AND tm.round_number = 1 
        AND tm.status = 'completed' 
        AND tm.winner_id IS NOT NULL
      ORDER BY tm.match_number
    LOOP
      BEGIN
        SELECT advance_sabo_tournament_fixed(
          v_match.tournament_id,
          v_match.id,
          v_match.winner_id
        ) INTO v_advancement_result;
        
        v_advancement_count := v_advancement_count + 1;
        RAISE NOTICE 'Re-advanced match % with result: %', v_match.id, v_advancement_result;
        
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to advance match %: %', v_match.id, SQLERRM;
          v_results := v_results || jsonb_build_object(
            'tournament_id', v_tournament.id,
            'match_id', v_match.id,
            'error', SQLERRM
          );
      END;
    END LOOP;
    
    -- Also re-trigger advancement for completed Round 2 matches
    FOR v_match IN
      SELECT tm.id, tm.tournament_id, tm.winner_id 
      FROM tournament_matches tm
      WHERE tm.tournament_id = v_tournament.id
        AND tm.round_number = 2 
        AND tm.status = 'completed' 
        AND tm.winner_id IS NOT NULL
      ORDER BY tm.match_number
    LOOP
      BEGIN
        SELECT advance_sabo_tournament_fixed(
          v_match.tournament_id,
          v_match.id,
          v_match.winner_id
        ) INTO v_advancement_result;
        
        v_advancement_count := v_advancement_count + 1;
        RAISE NOTICE 'Re-advanced Round 2 match % with result: %', v_match.id, v_advancement_result;
        
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to advance Round 2 match %: %', v_match.id, SQLERRM;
      END;
    END LOOP;
    
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournaments_reset', v_reset_count,
    'matches_advanced', v_advancement_count,
    'errors', v_results,
    'message', format('Reset %s tournaments and re-advanced %s matches', v_reset_count, v_advancement_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournaments_reset', v_reset_count,
      'matches_advanced', v_advancement_count
    );
END;
$$;

-- Execute the reset function
SELECT reset_broken_sabo_tournaments();