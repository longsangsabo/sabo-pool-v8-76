-- PHASE 1: DATABASE CLEANUP AND STANDARDIZATION
-- Remove duplicate and wrapper functions

-- Drop the old wrapper function
DROP FUNCTION IF EXISTS public.advance_double_elimination_winner(uuid);

-- Drop old versions of submit_double_elimination_score if they exist
DROP FUNCTION IF EXISTS public.submit_double_elimination_score_old(uuid, integer, integer);

-- Drop repair functions that are not needed
DROP FUNCTION IF EXISTS public.repair_double_elimination_tournament(uuid);

-- Ensure the main submit function uses correct column names
CREATE OR REPLACE FUNCTION public.submit_double_elimination_score(
  p_match_id uuid,
  p_player1_score integer,
  p_player2_score integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_match RECORD;
  v_winner_id uuid;
  v_loser_id uuid;
  v_result jsonb;
BEGIN
  -- Get match details using correct column names
  SELECT * INTO v_match
  FROM public.tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Determine winner
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
    v_loser_id := v_match.player2_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
    v_loser_id := v_match.player1_id;
  ELSE
    RETURN jsonb_build_object('error', 'Scores cannot be tied');
  END IF;
  
  -- Update match with scores and winner
  UPDATE public.tournament_matches
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    actual_end_time = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Auto-advance winners using the comprehensive function
  SELECT public.advance_double_elimination_winner_comprehensive(p_match_id) INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'scores', jsonb_build_object('player1', p_player1_score, 'player2', p_player2_score),
    'advancement_result', v_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;