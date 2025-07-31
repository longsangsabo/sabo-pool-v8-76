-- IMMEDIATE FIX: Create missing wrapper function
CREATE OR REPLACE FUNCTION public.advance_double_elimination_v9_fixed(
  p_tournament_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Call the proper SABO function instead
  SELECT fix_all_tournament_progression(p_tournament_id) INTO v_result;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$$;

-- CRITICAL FIX: Update submit_sabo_match_score to use correct column names and SABO function
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
  
  -- ✅ CRITICAL FIX: Update match with scores using CORRECT column names
  UPDATE tournament_matches 
  SET 
    score_player1 = p_player1_score,   -- Correct column name
    score_player2 = p_player2_score,   -- Correct column name
    winner_id = v_winner_id,
    status = 'completed',
    score_submitted_at = NOW(),
    score_input_by = p_submitted_by,
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- ✅ CRITICAL FIX: Call the correct SABO advancement function
  BEGIN
    SELECT advance_sabo_tournament_fixed(
      v_match.tournament_id,
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