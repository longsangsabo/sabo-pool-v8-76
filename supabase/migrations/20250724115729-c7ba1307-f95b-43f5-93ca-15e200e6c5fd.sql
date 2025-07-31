-- Fix the branched auto-advancement logic with better slot finding
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner_branched(p_match_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_winner_match UUID;
  v_next_loser_match UUID;
  v_advancement_result JSONB := jsonb_build_object();
BEGIN
  -- Get match details
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id AND status = 'completed' AND winner_id IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found or not completed');
  END IF;
  
  v_winner_id := v_match.winner_id;
  v_loser_id := CASE 
    WHEN v_match.player1_id = v_winner_id THEN v_match.player2_id 
    ELSE v_match.player1_id 
  END;
  
  RAISE NOTICE 'Processing match %: winner=%, loser=%', p_match_id, v_winner_id, v_loser_id;
  
  -- WINNER'S BRACKET ADVANCEMENT
  IF v_match.bracket_type = 'winners' THEN
    -- Advance winner to next round in winners bracket
    SELECT id INTO v_next_winner_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winners'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_winner_match IS NOT NULL THEN
      UPDATE tournament_matches 
      SET player1_id = CASE WHEN player1_id IS NULL THEN v_winner_id ELSE player1_id END,
          player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN v_winner_id ELSE player2_id END,
          updated_at = NOW()
      WHERE id = v_next_winner_match;
      
      v_advancement_result := v_advancement_result || jsonb_build_object('winner_advanced', true);
      RAISE NOTICE 'Winner % advanced to match %', v_winner_id, v_next_winner_match;
    END IF;
    
    -- Place loser in appropriate branch
    IF v_match.round_number = 1 THEN
      -- Loser goes to Branch A
      SELECT id INTO v_next_loser_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'losers'
        AND branch_type = 'branch_a'
        AND round_number = 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
      
      RAISE NOTICE 'Looking for Branch A slot, found: %', v_next_loser_match;
      
    ELSIF v_match.round_number = 2 THEN
      -- Loser goes to Branch B
      SELECT id INTO v_next_loser_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'losers'
        AND branch_type = 'branch_b'
        AND round_number = 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
      
      RAISE NOTICE 'Looking for Branch B slot, found: %', v_next_loser_match;
    END IF;
    
    IF v_next_loser_match IS NOT NULL THEN
      UPDATE tournament_matches 
      SET player1_id = CASE WHEN player1_id IS NULL THEN v_loser_id ELSE player1_id END,
          player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN v_loser_id ELSE player2_id END,
          updated_at = NOW()
      WHERE id = v_next_loser_match;
      
      v_advancement_result := v_advancement_result || jsonb_build_object('loser_placed', true);
      RAISE NOTICE 'Loser % placed in match %', v_loser_id, v_next_loser_match;
    ELSE
      RAISE NOTICE 'No available slot found for loser %', v_loser_id;
    END IF;
    
  -- LOSER'S BRACKET ADVANCEMENT
  ELSIF v_match.bracket_type = 'losers' THEN
    -- Advance winner within same branch
    IF v_match.branch_type = 'branch_a' THEN
      SELECT id INTO v_next_winner_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'losers'
        AND branch_type = 'branch_a'
        AND round_number = v_match.round_number + 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
    ELSIF v_match.branch_type = 'branch_b' THEN
      SELECT id INTO v_next_winner_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'losers'
        AND branch_type = 'branch_b'
        AND round_number = v_match.round_number + 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
    END IF;
    
    -- If no more matches in branch, advance to semifinal
    IF v_next_winner_match IS NULL THEN
      SELECT id INTO v_next_winner_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'semifinal'
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
    END IF;
    
    IF v_next_winner_match IS NOT NULL THEN
      UPDATE tournament_matches 
      SET player1_id = CASE WHEN player1_id IS NULL THEN v_winner_id ELSE player1_id END,
          player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN v_winner_id ELSE player2_id END,
          updated_at = NOW()
      WHERE id = v_next_winner_match;
      
      v_advancement_result := v_advancement_result || jsonb_build_object('winner_advanced', true);
    END IF;
    
  -- SEMIFINAL ADVANCEMENT
  ELSIF v_match.bracket_type = 'semifinal' THEN
    SELECT id INTO v_next_winner_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'grand_final'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_winner_match IS NOT NULL THEN
      UPDATE tournament_matches 
      SET player1_id = CASE WHEN player1_id IS NULL THEN v_winner_id ELSE player1_id END,
          player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN v_winner_id ELSE player2_id END,
          updated_at = NOW()
      WHERE id = v_next_winner_match;
      
      v_advancement_result := v_advancement_result || jsonb_build_object('winner_advanced', true);
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'bracket_type', v_match.bracket_type,
    'branch_type', v_match.branch_type,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id
  ) || v_advancement_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Auto-advancement failed: %s', SQLERRM)
    );
END;
$function$;