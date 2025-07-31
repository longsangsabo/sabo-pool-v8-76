-- First, let's see the current constraints on tournament_matches
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint 
WHERE conrelid = 'tournament_matches'::regclass
AND contype IN ('c', 'f', 'p', 'u')
ORDER BY conname;

-- Also check if there are any triggers that might be affecting score submission
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'tournament_matches'
AND trigger_schema = 'public';

-- Let's update the SABO score submission logic to properly determine the winner
-- Create a SABO-specific score submission function
CREATE OR REPLACE FUNCTION public.submit_sabo_match_score(
  p_match_id UUID,
  p_player1_score INTEGER,
  p_player2_score INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_tournament_id UUID;
  v_advancement_result JSONB;
BEGIN
  -- Get match details
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Determine winner based on scores
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
  ELSIF p_player2_score > p_player1_score THEN
    v_winner_id := v_match.player2_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Tie scores not allowed');
  END IF;
  
  -- Update the match with scores and winner
  UPDATE tournament_matches 
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    score_submitted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Get tournament ID for advancement
  v_tournament_id := v_match.tournament_id;
  
  -- Run SABO advancement logic
  SELECT advance_double_elimination_v9_fixed(v_tournament_id) INTO v_advancement_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'advancement_result', v_advancement_result,
    'message', 'Score submitted and advancement processed'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'match_id', p_match_id
    );
END;
$$;