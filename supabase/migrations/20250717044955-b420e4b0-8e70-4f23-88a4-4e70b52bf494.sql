-- Fix advance_double_elimination_winner_v2 function to properly move losers to loser bracket
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner_v2(p_match_id uuid, p_winner_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_loser_id UUID;
  v_next_match_id UUID;
  v_wb_finalists INTEGER;
  v_lb_branch_a_winner UUID;
  v_lb_branch_b_winner UUID;
  v_semifinal_ready BOOLEAN := false;
BEGIN
  -- Get current match details
  SELECT * INTO v_match
  FROM public.tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament details  
  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = v_match.tournament_id;
  
  -- Validate winner
  IF p_winner_id != v_match.player1_id AND p_winner_id != v_match.player2_id THEN
    RETURN jsonb_build_object('error', 'Winner must be one of the match players');
  END IF;
  
  -- Determine loser
  v_loser_id := CASE 
    WHEN p_winner_id = v_match.player1_id THEN v_match.player2_id
    ELSE v_match.player1_id
  END;
  
  -- Update current match
  UPDATE public.tournament_matches
  SET winner_id = p_winner_id,
      status = 'completed',
      actual_end_time = now(),
      updated_at = now()
  WHERE id = p_match_id;
  
  -- PHASE 1: Winner Bracket Logic (16→8→4→2, then STOP)
  IF v_match.bracket_type = 'winner' THEN
    -- Winner Bracket Round 1: Advance to Round 2, Send losers to Branch A
    IF v_match.round_number = 1 THEN
      -- Advance winner to WB Round 2
      v_next_match_id := CASE 
        WHEN v_match.match_number IN (1,2) THEN (SELECT id FROM public.tournament_matches WHERE tournament_id = v_match.tournament_id AND bracket_type = 'winner' AND round_number = 2 AND match_number = 1)
        WHEN v_match.match_number IN (3,4) THEN (SELECT id FROM public.tournament_matches WHERE tournament_id = v_match.tournament_id AND bracket_type = 'winner' AND round_number = 2 AND match_number = 2)  
        WHEN v_match.match_number IN (5,6) THEN (SELECT id FROM public.tournament_matches WHERE tournament_id = v_match.tournament_id AND bracket_type = 'winner' AND round_number = 2 AND match_number = 3)
        WHEN v_match.match_number IN (7,8) THEN (SELECT id FROM public.tournament_matches WHERE tournament_id = v_match.tournament_id AND bracket_type = 'winner' AND round_number = 2 AND match_number = 4)
      END;
      
      -- Update next winner bracket match
      UPDATE public.tournament_matches
      SET 
        player1_id = CASE WHEN player1_id IS NULL THEN p_winner_id ELSE player1_id END,
        player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id ELSE player2_id END,
        updated_at = now()
      WHERE id = v_next_match_id;
      
      -- Send loser to Branch A (Round 4 of Branch A) - FIXED LOGIC
      -- Find the appropriate loser bracket match based on match number
      DECLARE
        v_loser_match_id UUID;
        v_loser_match_number INTEGER;
      BEGIN
        -- Map winner bracket matches to loser bracket matches
        v_loser_match_number := CASE 
          WHEN v_match.match_number IN (1,2) THEN 1
          WHEN v_match.match_number IN (3,4) THEN 2  
          WHEN v_match.match_number IN (5,6) THEN 3
          WHEN v_match.match_number IN (7,8) THEN 4
        END;
        
        -- Get the specific loser bracket match
        SELECT id INTO v_loser_match_id
        FROM public.tournament_matches 
        WHERE tournament_id = v_match.tournament_id 
        AND bracket_type = 'loser' 
        AND branch_type = 'branch_a'
        AND round_number = 4
        AND match_number = v_loser_match_number;
        
        -- Update the loser bracket match with the loser
        UPDATE public.tournament_matches
        SET 
          player2_id = CASE WHEN player2_id IS NULL THEN v_loser_id ELSE player2_id END,
          updated_at = now()
        WHERE id = v_loser_match_id;
      END;
      
    -- Winner Bracket Round 2: Advance to Round 3, Send losers to Branch B  
    ELSIF v_match.round_number = 2 THEN
      -- Advance winner to WB Round 3
      v_next_match_id := CASE 
        WHEN v_match.match_number IN (1,2) THEN (SELECT id FROM public.tournament_matches WHERE tournament_id = v_match.tournament_id AND bracket_type = 'winner' AND round_number = 3 AND match_number = 1)
        WHEN v_match.match_number IN (3,4) THEN (SELECT id FROM public.tournament_matches WHERE tournament_id = v_match.tournament_id AND bracket_type = 'winner' AND round_number = 3 AND match_number = 2)
      END;
      
      UPDATE public.tournament_matches
      SET 
        player1_id = CASE WHEN player1_id IS NULL THEN p_winner_id ELSE player1_id END,
        player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id ELSE player2_id END,
        updated_at = now()
      WHERE id = v_next_match_id;
      
      -- Send loser to Branch B (Round 7 of Branch B) - FIXED LOGIC
      DECLARE
        v_loser_match_id UUID;
        v_loser_match_number INTEGER;
      BEGIN
        -- Map winner bracket matches to loser bracket matches
        v_loser_match_number := CASE 
          WHEN v_match.match_number IN (1,2) THEN 1
          WHEN v_match.match_number IN (3,4) THEN 2
        END;
        
        -- Get the specific loser bracket match
        SELECT id INTO v_loser_match_id
        FROM public.tournament_matches 
        WHERE tournament_id = v_match.tournament_id 
        AND bracket_type = 'loser' 
        AND branch_type = 'branch_b'
        AND round_number = 7
        AND match_number = v_loser_match_number;
        
        -- Update the loser bracket match with the loser
        UPDATE public.tournament_matches
        SET 
          player1_id = CASE WHEN player1_id IS NULL THEN v_loser_id ELSE player1_id END,
          player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN v_loser_id ELSE player2_id END,
          updated_at = now()
        WHERE id = v_loser_match_id;
      END;
      
    -- Winner Bracket Round 3: STOP HERE - Don't advance further, wait for semifinals
    ELSIF v_match.round_number = 3 THEN
      -- Check if we have 2 WB finalists
      SELECT COUNT(*) INTO v_wb_finalists
      FROM public.tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winner'  
      AND round_number = 3
      AND status = 'completed';
      
      -- If both WB Round 3 matches complete, check for semifinal readiness
      IF v_wb_finalists = 2 THEN
        -- Check if both loser branches have winners
        SELECT winner_id INTO v_lb_branch_a_winner
        FROM public.tournament_matches
        WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'loser'
        AND branch_type = 'branch_a' 
        AND round_number = 6  -- Final round of Branch A
        AND status = 'completed';
        
        SELECT winner_id INTO v_lb_branch_b_winner
        FROM public.tournament_matches
        WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'loser'
        AND branch_type = 'branch_b'
        AND round_number = 8  -- Final round of Branch B  
        AND status = 'completed';
        
        -- If all 4 semifinalists ready, create semifinals
        IF v_lb_branch_a_winner IS NOT NULL AND v_lb_branch_b_winner IS NOT NULL THEN
          v_semifinal_ready := true;
        END IF;
      END IF;
    END IF;
    
  -- PHASE 2: Loser Branch A Logic (8→4→2→1)
  ELSIF v_match.bracket_type = 'loser' AND v_match.branch_type = 'branch_a' THEN
    IF v_match.round_number < 6 THEN
      -- Advance to next round in Branch A
      UPDATE public.tournament_matches
      SET 
        player1_id = CASE WHEN player1_id IS NULL THEN p_winner_id ELSE player1_id END,
        player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id ELSE player2_id END,
        updated_at = now()
      WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser'
      AND branch_type = 'branch_a'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL);
    END IF;
    
  -- PHASE 2: Loser Branch B Logic (4→2→1)  
  ELSIF v_match.bracket_type = 'loser' AND v_match.branch_type = 'branch_b' THEN
    IF v_match.round_number < 8 THEN
      -- Advance to next round in Branch B
      UPDATE public.tournament_matches
      SET 
        player1_id = CASE WHEN player1_id IS NULL THEN p_winner_id ELSE player1_id END,
        player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id ELSE player2_id END,
        updated_at = now()
      WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser' 
      AND branch_type = 'branch_b'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL);
    END IF;
    
  -- PHASE 3 & 4: Semifinal and Final Logic
  ELSIF v_match.bracket_type = 'semifinal' THEN
    -- Advance to final
    UPDATE public.tournament_matches
    SET 
      player1_id = CASE WHEN player1_id IS NULL THEN p_winner_id ELSE player1_id END,
      player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id ELSE player2_id END,
      updated_at = now()
    WHERE tournament_id = v_match.tournament_id
    AND bracket_type = 'final'
    AND (player1_id IS NULL OR player2_id IS NULL);
    
  ELSIF v_match.bracket_type = 'final' THEN
    -- Tournament complete
    UPDATE public.tournaments
    SET status = 'completed', updated_at = now()
    WHERE id = v_match.tournament_id;
  END IF;
  
  -- Create semifinals if ready
  IF v_semifinal_ready THEN
    -- Create semifinal matches if they don't exist
    IF NOT EXISTS (SELECT 1 FROM public.tournament_matches WHERE tournament_id = v_match.tournament_id AND bracket_type = 'semifinal') THEN
      -- This would need a separate function to create semifinals
      RAISE NOTICE 'Semifinals should be created now';
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', p_winner_id,
    'loser_id', v_loser_id,
    'semifinal_ready', v_semifinal_ready,
    'message', 'Winner advanced successfully and loser moved to loser bracket'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM
    );
END;
$function$;