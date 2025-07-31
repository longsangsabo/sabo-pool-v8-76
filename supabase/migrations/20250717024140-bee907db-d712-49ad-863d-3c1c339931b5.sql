-- Add branch_type field for loser bracket structure
ALTER TABLE tournament_matches 
ADD COLUMN IF NOT EXISTS branch_type TEXT DEFAULT NULL;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_tournament_matches_branch_type 
ON tournament_matches(tournament_id, branch_type, round_number);

-- Create new function for Double Elimination with 4-phase flow
CREATE OR REPLACE FUNCTION advance_double_elimination_winner_v2(
  p_match_id UUID,
  p_winner_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
        player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id ELSE player2_id END
      WHERE id = v_next_match_id;
      
      -- Send loser to Branch A (Round 1 of Branch A)
      UPDATE public.tournament_matches
      SET 
        player1_id = CASE WHEN player1_id IS NULL THEN v_loser_id ELSE player1_id END,
        player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN v_loser_id ELSE player2_id END
      WHERE tournament_id = v_match.tournament_id 
      AND bracket_type = 'loser' 
      AND branch_type = 'branch_a'
      AND round_number = 1
      AND (player1_id IS NULL OR player2_id IS NULL);
      
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
        player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id ELSE player2_id END
      WHERE id = v_next_match_id;
      
      -- Send loser to Branch B (Round 1 of Branch B)
      UPDATE public.tournament_matches
      SET 
        player1_id = CASE WHEN player1_id IS NULL THEN v_loser_id ELSE player1_id END,
        player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN v_loser_id ELSE player2_id END
      WHERE tournament_id = v_match.tournament_id 
      AND bracket_type = 'loser' 
      AND branch_type = 'branch_b'
      AND round_number = 1
      AND (player1_id IS NULL OR player2_id IS NULL);
      
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
        AND round_number = 3  -- Final round of Branch A
        AND status = 'completed';
        
        SELECT winner_id INTO v_lb_branch_b_winner
        FROM public.tournament_matches
        WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'loser'
        AND branch_type = 'branch_b'
        AND round_number = 2  -- Final round of Branch B  
        AND status = 'completed';
        
        -- If all 4 semifinalists ready, create semifinals
        IF v_lb_branch_a_winner IS NOT NULL AND v_lb_branch_b_winner IS NOT NULL THEN
          v_semifinal_ready := true;
        END IF;
      END IF;
    END IF;
    
  -- PHASE 2: Loser Branch A Logic (8→4→2→1)
  ELSIF v_match.bracket_type = 'loser' AND v_match.branch_type = 'branch_a' THEN
    IF v_match.round_number < 3 THEN
      -- Advance to next round in Branch A
      UPDATE public.tournament_matches
      SET 
        player1_id = CASE WHEN player1_id IS NULL THEN p_winner_id ELSE player1_id END,
        player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id ELSE player2_id END
      WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser'
      AND branch_type = 'branch_a'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL);
    END IF;
    
  -- PHASE 2: Loser Branch B Logic (4→2→1)  
  ELSIF v_match.bracket_type = 'loser' AND v_match.branch_type = 'branch_b' THEN
    IF v_match.round_number < 2 THEN
      -- Advance to next round in Branch B
      UPDATE public.tournament_matches
      SET 
        player1_id = CASE WHEN player1_id IS NULL THEN p_winner_id ELSE player1_id END,
        player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id ELSE player2_id END
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
      player2_id = CASE WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id ELSE player2_id END
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
    PERFORM public.create_double_elimination_semifinals(v_match.tournament_id);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'winner_id', p_winner_id,
    'semifinal_ready', v_semifinal_ready,
    'message', 'Winner advanced successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM
    );
END;
$$;

-- Function to create semifinals when all 4 participants are ready
CREATE OR REPLACE FUNCTION create_double_elimination_semifinals(
  p_tournament_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_wb_winners UUID[];
  v_lb_branch_a_winner UUID;
  v_lb_branch_b_winner UUID;
BEGIN
  -- Get 2 Winner Bracket finalists
  SELECT ARRAY_AGG(winner_id) INTO v_wb_winners
  FROM public.tournament_matches
  WHERE tournament_id = p_tournament_id
  AND bracket_type = 'winner'
  AND round_number = 3
  AND status = 'completed';
  
  -- Get Loser Branch A winner
  SELECT winner_id INTO v_lb_branch_a_winner
  FROM public.tournament_matches
  WHERE tournament_id = p_tournament_id
  AND bracket_type = 'loser'
  AND branch_type = 'branch_a'
  AND round_number = 3
  AND status = 'completed';
  
  -- Get Loser Branch B winner
  SELECT winner_id INTO v_lb_branch_b_winner
  FROM public.tournament_matches
  WHERE tournament_id = p_tournament_id
  AND bracket_type = 'loser'
  AND branch_type = 'branch_b' 
  AND round_number = 2
  AND status = 'completed';
  
  -- Create Semifinal Match 1: WB Winner 1 vs LB Branch A Winner
  INSERT INTO public.tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, scheduled_time, created_at, updated_at
  ) VALUES (
    p_tournament_id, 'semifinal', 1, 1,
    v_wb_winners[1], v_lb_branch_a_winner, 'scheduled', 
    (SELECT tournament_start FROM public.tournaments WHERE id = p_tournament_id),
    now(), now()
  );
  
  -- Create Semifinal Match 2: WB Winner 2 vs LB Branch B Winner  
  INSERT INTO public.tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, scheduled_time, created_at, updated_at
  ) VALUES (
    p_tournament_id, 'semifinal', 1, 2,
    v_wb_winners[2], v_lb_branch_b_winner, 'scheduled',
    (SELECT tournament_start FROM public.tournaments WHERE id = p_tournament_id),
    now(), now()
  );
  
  -- Create Final Match (empty for now)
  INSERT INTO public.tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, scheduled_time, created_at, updated_at
  ) VALUES (
    p_tournament_id, 'final', 1, 1,
    NULL, NULL, 'pending',
    (SELECT tournament_start FROM public.tournaments WHERE id = p_tournament_id),
    now(), now()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Semifinals created with 4 participants',
    'participants', jsonb_build_object(
      'wb_winners', v_wb_winners,
      'lb_branch_a', v_lb_branch_a_winner,
      'lb_branch_b', v_lb_branch_b_winner
    )
  );
END;
$$;