-- Fix the loser branch advancement logic 
-- This function ensures winners advance correctly to the finals

CREATE OR REPLACE FUNCTION public.fix_loser_branch_finals()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id UUID;
  v_branch_a_winners UUID[];
  v_branch_b_winners UUID[];
  v_final_match_a UUID;
  v_final_match_b UUID;
BEGIN
  -- Get the test tournament ID
  SELECT id INTO v_tournament_id 
  FROM tournaments 
  WHERE name ILIKE '%test%' 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF v_tournament_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No test tournament found');
  END IF;
  
  -- Get Branch A semifinal winners (Round 102 winners should advance to Round 103)
  SELECT array_agg(winner_id) INTO v_branch_a_winners
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND round_number = 102
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- Get Branch B semifinal winners (Round 201 winners should advance to Round 202)  
  SELECT array_agg(winner_id) INTO v_branch_b_winners
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND round_number = 201
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- Update Branch A Final (Round 103)
  SELECT id INTO v_final_match_a
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND round_number = 103
  AND match_number = 1;
  
  IF v_final_match_a IS NOT NULL AND array_length(v_branch_a_winners, 1) = 2 THEN
    UPDATE tournament_matches 
    SET player1_id = v_branch_a_winners[1],
        player2_id = v_branch_a_winners[2],
        status = 'scheduled'
    WHERE id = v_final_match_a;
  END IF;
  
  -- Update Branch B Final (Round 202)
  SELECT id INTO v_final_match_b
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND round_number = 202
  AND match_number = 1;
  
  IF v_final_match_b IS NOT NULL AND array_length(v_branch_b_winners, 1) = 2 THEN
    UPDATE tournament_matches 
    SET player1_id = v_branch_b_winners[1],
        player2_id = v_branch_b_winners[2],
        status = 'scheduled'  
    WHERE id = v_final_match_b;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament_id,
    'branch_a_winners', v_branch_a_winners,
    'branch_b_winners', v_branch_b_winners,
    'branch_a_final_updated', v_final_match_a IS NOT NULL,
    'branch_b_final_updated', v_final_match_b IS NOT NULL
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Run the fix
SELECT fix_loser_branch_finals();