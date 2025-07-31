-- Fix duplicate player issue in loser bracket finals
-- This happens when the advancement logic incorrectly assigns the same player twice

CREATE OR REPLACE FUNCTION public.debug_and_fix_bracket_advancement()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament_id UUID;
  v_debug_info JSONB;
  v_winners_r1 UUID[];
  v_winners_r2 UUID[];
  v_losers_r1 UUID[];
  v_losers_r2 UUID[];
  v_branch_a_102_winners UUID[];
  v_branch_b_201_winners UUID[];
BEGIN
  -- Get tournament ID
  SELECT id INTO v_tournament_id 
  FROM tournaments 
  WHERE name ILIKE '%test%' 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Get winners bracket losers for seeding loser brackets
  SELECT array_agg(CASE WHEN player1_id != winner_id THEN player1_id ELSE player2_id END)
  INTO v_losers_r1
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'winners'
  AND round_number = 1
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  SELECT array_agg(CASE WHEN player1_id != winner_id THEN player1_id ELSE player2_id END)
  INTO v_losers_r2
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'winners'
  AND round_number = 2
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- Get Branch A Round 102 winners (should advance to 103)
  SELECT array_agg(winner_id)
  INTO v_branch_a_102_winners
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND round_number = 102
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- Get Branch B Round 201 winners (should advance to 202)
  SELECT array_agg(winner_id)
  INTO v_branch_b_201_winners
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND round_number = 201
  AND status = 'completed'
  AND winner_id IS NOT NULL;
  
  -- Debug current state
  v_debug_info := jsonb_build_object(
    'tournament_id', v_tournament_id,
    'winners_r1_losers', v_losers_r1,
    'winners_r2_losers', v_losers_r2,
    'branch_a_102_winners', v_branch_a_102_winners,
    'branch_b_201_winners', v_branch_b_201_winners
  );
  
  -- Clear wrong assignments first
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, status = 'pending'
  WHERE tournament_id = v_tournament_id 
  AND bracket_type = 'losers'
  AND round_number IN (101, 102, 103, 201, 202)
  AND status != 'completed';
  
  -- Re-seed Branch A Round 101 with Winners R1 losers
  IF array_length(v_losers_r1, 1) >= 8 THEN
    UPDATE tournament_matches 
    SET player1_id = v_losers_r1[1], player2_id = v_losers_r1[2], status = 'scheduled'
    WHERE tournament_id = v_tournament_id AND bracket_type = 'losers' AND round_number = 101 AND match_number = 1;
    
    UPDATE tournament_matches 
    SET player1_id = v_losers_r1[3], player2_id = v_losers_r1[4], status = 'scheduled'
    WHERE tournament_id = v_tournament_id AND bracket_type = 'losers' AND round_number = 101 AND match_number = 2;
    
    UPDATE tournament_matches 
    SET player1_id = v_losers_r1[5], player2_id = v_losers_r1[6], status = 'scheduled'
    WHERE tournament_id = v_tournament_id AND bracket_type = 'losers' AND round_number = 101 AND match_number = 3;
    
    UPDATE tournament_matches 
    SET player1_id = v_losers_r1[7], player2_id = v_losers_r1[8], status = 'scheduled'
    WHERE tournament_id = v_tournament_id AND bracket_type = 'losers' AND round_number = 101 AND match_number = 4;
  END IF;
  
  -- Re-seed Branch B Round 201 with Winners R2 losers
  IF array_length(v_losers_r2, 1) >= 4 THEN
    UPDATE tournament_matches 
    SET player1_id = v_losers_r2[1], player2_id = v_losers_r2[2], status = 'scheduled'
    WHERE tournament_id = v_tournament_id AND bracket_type = 'losers' AND round_number = 201 AND match_number = 1;
    
    UPDATE tournament_matches 
    SET player1_id = v_losers_r2[3], player2_id = v_losers_r2[4], status = 'scheduled'
    WHERE tournament_id = v_tournament_id AND bracket_type = 'losers' AND round_number = 201 AND match_number = 2;
  END IF;
  
  -- Fix Branch A Final (103) with correct winners from 102
  IF array_length(v_branch_a_102_winners, 1) = 2 THEN
    UPDATE tournament_matches 
    SET player1_id = v_branch_a_102_winners[1], 
        player2_id = v_branch_a_102_winners[2], 
        status = 'scheduled'
    WHERE tournament_id = v_tournament_id 
    AND bracket_type = 'losers' 
    AND round_number = 103 
    AND match_number = 1;
  END IF;
  
  -- Fix Branch B Final (202) with correct winners from 201
  IF array_length(v_branch_b_201_winners, 1) = 2 THEN
    UPDATE tournament_matches 
    SET player1_id = v_branch_b_201_winners[1], 
        player2_id = v_branch_b_201_winners[2], 
        status = 'scheduled'
    WHERE tournament_id = v_tournament_id 
    AND bracket_type = 'losers' 
    AND round_number = 202 
    AND match_number = 1;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'debug_info', v_debug_info,
    'fixed_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM, 'debug_info', v_debug_info);
END;
$$;

-- Execute the fix
SELECT debug_and_fix_bracket_advancement();