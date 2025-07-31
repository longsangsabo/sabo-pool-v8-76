-- Create a test function to simulate match completion and test auto advancement
CREATE OR REPLACE FUNCTION public.test_auto_advancement(p_tournament_id uuid, p_match_number integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_match_id uuid;
  v_player1_id uuid;
  v_result jsonb;
BEGIN
  -- Get first match without winner
  SELECT id, player1_id INTO v_match_id, v_player1_id
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
  AND round_number = 1
  AND match_number = p_match_number
  AND winner_id IS NULL;
  
  IF v_match_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No available match to test');
  END IF;
  
  -- Update match to completed with winner
  UPDATE tournament_matches
  SET status = 'completed',
      winner_id = v_player1_id,
      score_player1 = 5,
      score_player2 = 3,
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = v_match_id;
  
  -- Wait a moment for triggers to execute
  PERFORM pg_sleep(1);
  
  -- Check if next round was created
  SELECT COUNT(*) as next_round_matches INTO v_result
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id
  AND round_number = 2;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', v_match_id,
    'winner_id', v_player1_id,
    'next_round_matches', (v_result->>'next_round_matches')::integer,
    'message', 'Match completed, checking if auto advancement triggered'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$function$;

-- Test the function
SELECT public.test_auto_advancement('675d9a5a-d3b1-452a-b019-91303ea4712b', 1);