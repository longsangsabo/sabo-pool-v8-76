-- Fix SPECIFICALLY for double1 tournament (not the test tournament)
CREATE OR REPLACE FUNCTION public.fix_double1_tournament_bracket()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id UUID := '36f6dd14-2f12-469d-be24-1649bdca034b'; -- double1 tournament ID
  v_branch_a_winners UUID[];
  v_branch_b_winners UUID[];
BEGIN
  -- 1. Clear the problematic loser bracket finals 
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, status = 'pending', winner_id = NULL
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND round_number IN (103, 202);
  
  -- 2. Get winners from Branch A semifinals (round 102)
  SELECT array_agg(winner_id ORDER BY match_number) INTO v_branch_a_winners
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND round_number = 102
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- 3. Get winners from Branch B semifinals (round 201)  
  SELECT array_agg(winner_id ORDER BY match_number) INTO v_branch_b_winners
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND round_number = 201
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- 4. Set Branch A Final (round 103) with correct players
  IF array_length(v_branch_a_winners, 1) = 2 THEN
    UPDATE tournament_matches 
    SET player1_id = v_branch_a_winners[1],
        player2_id = v_branch_a_winners[2],
        status = 'scheduled'
    WHERE tournament_id = v_tournament_id 
    AND bracket_type = 'losers' 
    AND round_number = 103 
    AND match_number = 1;
  END IF;
  
  -- 5. Set Branch B Final (round 202) with correct players
  IF array_length(v_branch_b_winners, 1) = 2 THEN
    UPDATE tournament_matches 
    SET player1_id = v_branch_b_winners[1],
        player2_id = v_branch_b_winners[2], 
        status = 'scheduled'
    WHERE tournament_id = v_tournament_id 
    AND bracket_type = 'losers' 
    AND round_number = 202 
    AND match_number = 1;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'tournament_name', 'double1',
    'branch_a_winners', v_branch_a_winners,
    'branch_b_winners', v_branch_b_winners,
    'fixed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Execute the fix for double1 tournament
SELECT fix_double1_tournament_bracket();