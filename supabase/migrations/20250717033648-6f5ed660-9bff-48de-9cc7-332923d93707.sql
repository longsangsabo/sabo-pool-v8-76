-- Fix Double Elimination Auto-Movement Logic
CREATE OR REPLACE FUNCTION public.advance_double_elimination_winner(
  p_match_id UUID,
  p_winner_id UUID,
  p_loser_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_winner_next_match_id UUID;
  v_loser_next_match_id UUID;
  v_target_branch TEXT;
  v_target_round INTEGER;
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
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Validate winner and loser are correct
  IF (p_winner_id != v_match.player1_id AND p_winner_id != v_match.player2_id) OR
     (p_loser_id != v_match.player1_id AND p_loser_id != v_match.player2_id) OR
     (p_winner_id = p_loser_id) THEN
    RETURN jsonb_build_object('error', 'Invalid winner/loser combination');
  END IF;
  
  -- Update current match
  UPDATE public.tournament_matches
  SET winner_id = p_winner_id,
      status = 'completed',
      actual_end_time = now(),
      updated_at = now()
  WHERE id = p_match_id;
  
  -- Handle Winner Bracket matches
  IF v_match.bracket_type = 'winner' THEN
    -- Advance winner to next round in winner bracket (if not final)
    IF v_match.round_number < 3 THEN  -- Winner bracket goes up to Round 3
      v_next_round := v_match.round_number + 1;
      v_next_match_number := CEIL(v_match.match_number::NUMERIC / 2);
      
      -- Find next winner bracket match
      SELECT id INTO v_winner_next_match_id
      FROM public.tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winner'
      AND round_number = v_next_round
      AND match_number = v_next_match_number;
      
      IF v_winner_next_match_id IS NOT NULL THEN
        -- Update existing match with winner
        UPDATE public.tournament_matches
        SET 
          player1_id = CASE 
            WHEN player1_id IS NULL THEN p_winner_id
            ELSE player1_id
          END,
          player2_id = CASE 
            WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id
            ELSE player2_id
          END,
          updated_at = now()
        WHERE id = v_winner_next_match_id;
      END IF;
    END IF;
    
    -- Move loser to correct loser bracket branch
    IF v_match.round_number = 1 THEN
      -- WB Round 1 losers go to Loser Branch A Round 1 (Round 4)
      v_target_branch := 'branch_a';
      v_target_round := 4;
    ELSIF v_match.round_number = 2 THEN
      -- WB Round 2 losers go to Loser Branch B Round 1 (Round 7)
      v_target_branch := 'branch_b';
      v_target_round := 7;
    ELSIF v_match.round_number = 3 THEN
      -- WB Round 3 losers would go to semifinals (not yet implemented)
      v_target_branch := NULL;
      v_target_round := NULL;
    END IF;
    
    -- Place loser in the correct branch if target is defined
    IF v_target_branch IS NOT NULL AND v_target_round IS NOT NULL THEN
      SELECT id INTO v_loser_next_match_id
      FROM public.tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser'
      AND branch_type = v_target_branch
      AND round_number = v_target_round
      AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number
      LIMIT 1;
      
      IF v_loser_next_match_id IS NOT NULL THEN
        UPDATE public.tournament_matches
        SET 
          player1_id = CASE 
            WHEN player1_id IS NULL THEN p_loser_id
            ELSE player1_id
          END,
          player2_id = CASE 
            WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_loser_id
            ELSE player2_id
          END,
          updated_at = now()
        WHERE id = v_loser_next_match_id;
      END IF;
    END IF;
    
  -- Handle Loser Bracket matches
  ELSIF v_match.bracket_type = 'loser' THEN
    -- Advance winner within loser bracket
    IF (v_match.branch_type = 'branch_a' AND v_match.round_number < 6) OR
       (v_match.branch_type = 'branch_b' AND v_match.round_number < 8) THEN
      
      v_next_round := v_match.round_number + 1;
      v_next_match_number := CEIL(v_match.match_number::NUMERIC / 2);
      
      -- Find next loser bracket match in same branch
      SELECT id INTO v_winner_next_match_id
      FROM public.tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser'
      AND branch_type = v_match.branch_type
      AND round_number = v_next_round
      AND match_number = v_next_match_number;
      
      IF v_winner_next_match_id IS NOT NULL THEN
        UPDATE public.tournament_matches
        SET 
          player1_id = CASE 
            WHEN player1_id IS NULL THEN p_winner_id
            ELSE player1_id
          END,
          player2_id = CASE 
            WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN p_winner_id
            ELSE player2_id
          END,
          updated_at = now()
        WHERE id = v_winner_next_match_id;
      END IF;
    END IF;
    -- Loser is eliminated (no further movement)
  END IF;
  
  -- Log the advancement
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'double_elimination_advancement',
    format('Double elimination advancement: winner %s, loser %s in %s bracket R%s M%s', 
      p_winner_id, p_loser_id, v_match.bracket_type, v_match.round_number, v_match.match_number),
    jsonb_build_object(
      'tournament_id', v_match.tournament_id,
      'match_id', p_match_id,
      'winner_id', p_winner_id,
      'loser_id', p_loser_id,
      'bracket_type', v_match.bracket_type,
      'target_branch', v_target_branch,
      'target_round', v_target_round
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Double elimination advancement completed',
    'winner_next_match', v_winner_next_match_id,
    'loser_next_match', v_loser_next_match_id,
    'loser_target_branch', v_target_branch,
    'loser_target_round', v_target_round
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance double elimination: ' || SQLERRM
    );
END;
$$;