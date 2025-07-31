-- Update the SABO score submission function to use correct column names
DROP FUNCTION IF EXISTS public.submit_sabo_match_score(uuid, integer, integer, uuid);

CREATE OR REPLACE FUNCTION public.submit_sabo_match_score(
  p_match_id uuid,
  p_player1_score integer,
  p_player2_score integer,
  p_submitted_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match record;
  v_winner_id uuid;
  v_tournament_id uuid;
  v_advancement_result jsonb;
BEGIN
  -- Get match details
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Match not found',
      'match_id', p_match_id
    );
  END IF;
  
  -- Accept both scheduled and in_progress status
  IF v_match.status NOT IN ('scheduled', 'in_progress') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Match not ready for score submission. Status: %s', v_match.status),
      'match_id', p_match_id
    );
  END IF;
  
  -- Auto-start if scheduled
  IF v_match.status = 'scheduled' THEN
    UPDATE tournament_matches 
    SET 
      status = 'in_progress',
      updated_at = NOW()
    WHERE id = p_match_id;
  END IF;
  
  -- Validate scores
  IF p_player1_score < 0 OR p_player2_score < 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Scores cannot be negative',
      'match_id', p_match_id
    );
  END IF;
  
  IF p_player1_score = p_player2_score THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Matches cannot end in a tie',
      'match_id', p_match_id
    );
  END IF;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSE
    v_winner_id := v_match.player2_id;
  END IF;
  
  -- Update match with scores and winner (using correct column names)
  UPDATE tournament_matches 
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    score_submitted_at = NOW(),
    score_input_by = p_submitted_by,
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Get tournament ID for advancement
  v_tournament_id := v_match.tournament_id;
  
  -- ✅ CRITICAL FIX: Call the correct SABO advancement function
  BEGIN
    SELECT advance_sabo_tournament_fixed(
      v_tournament_id,
      p_match_id,
      v_winner_id
    ) INTO v_advancement_result;
    
    RAISE NOTICE 'SABO advancement result: %', v_advancement_result;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the score submission
      RAISE WARNING 'SABO advancement failed: %', SQLERRM;
      RETURN jsonb_build_object(
        'success', false, 
        'error', format('Score submitted but advancement failed: %s', SQLERRM),
        'match_id', p_match_id,
        'winner_id', v_winner_id,
        'advancement_error', SQLERRM
      );
  END;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Score submitted and tournament advanced successfully',
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'advancement_result', v_advancement_result
  );
END;
$$;

-- Update the reset function to use correct column names
DROP FUNCTION IF EXISTS public.reset_broken_sabo_tournaments();

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
    
    -- Reset matches in Round 2+ that don't have players (using correct column names)
    UPDATE tournament_matches 
    SET 
      player1_id = NULL,
      player2_id = NULL,
      status = 'pending',
      score_player1 = NULL,
      score_player2 = NULL,
      winner_id = NULL,
      score_submitted_at = NULL,
      score_input_by = NULL,
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

-- Execute the reset to fix broken tournaments
SELECT reset_broken_sabo_tournaments();