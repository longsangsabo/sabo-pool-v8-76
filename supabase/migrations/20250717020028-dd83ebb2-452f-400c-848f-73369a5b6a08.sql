-- Create advance_double_elimination_winner function
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
  v_loser_bracket_round INTEGER;
  v_loser_bracket_match_number INTEGER;
  v_winner_next_match_id UUID;
  v_loser_next_match_id UUID;
  v_max_winner_round INTEGER;
  v_max_loser_round INTEGER;
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
  
  -- Get max rounds for winner and loser brackets
  SELECT MAX(round_number) INTO v_max_winner_round
  FROM public.tournament_matches
  WHERE tournament_id = v_match.tournament_id
  AND bracket_type = 'winner';
  
  SELECT MAX(round_number) INTO v_max_loser_round
  FROM public.tournament_matches
  WHERE tournament_id = v_match.tournament_id
  AND bracket_type = 'loser';
  
  -- Handle Winner Bracket matches
  IF v_match.bracket_type = 'winner' THEN
    -- Advance winner to next round in winner bracket
    IF v_match.round_number < v_max_winner_round THEN
      v_next_round := v_match.round_number + 1;
      v_next_match_number := CEIL(v_match.match_number::NUMERIC / 2);
      
      -- Find or create next winner bracket match
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
            WHEN player1_id IS NULL AND v_match.match_number % 2 = 1 THEN p_winner_id
            ELSE player1_id
          END,
          player2_id = CASE 
            WHEN player2_id IS NULL AND v_match.match_number % 2 = 0 THEN p_winner_id
            ELSE player2_id
          END,
          updated_at = now()
        WHERE id = v_winner_next_match_id;
      END IF;
    END IF;
    
    -- Move loser to loser bracket
    -- Calculate loser bracket position based on winner bracket round
    v_loser_bracket_round := (v_max_winner_round - v_match.round_number) * 2;
    IF v_match.round_number > 1 THEN
      v_loser_bracket_round := v_loser_bracket_round - 1;
    END IF;
    
    -- Find appropriate loser bracket match
    SELECT id INTO v_loser_next_match_id
    FROM public.tournament_matches
    WHERE tournament_id = v_match.tournament_id
    AND bracket_type = 'loser'
    AND round_number = v_loser_bracket_round
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
    
  -- Handle Loser Bracket matches
  ELSIF v_match.bracket_type = 'loser' THEN
    -- Only advance winner in loser bracket (loser is eliminated)
    IF v_match.round_number < v_max_loser_round THEN
      v_next_round := v_match.round_number + 1;
      v_next_match_number := CEIL(v_match.match_number::NUMERIC / 2);
      
      -- Find next loser bracket match
      SELECT id INTO v_winner_next_match_id
      FROM public.tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'loser'
      AND round_number = v_next_round
      AND match_number = v_next_match_number;
      
      IF v_winner_next_match_id IS NOT NULL THEN
        UPDATE public.tournament_matches
        SET 
          player1_id = CASE 
            WHEN player1_id IS NULL AND v_match.match_number % 2 = 1 THEN p_winner_id
            ELSE player1_id
          END,
          player2_id = CASE 
            WHEN player2_id IS NULL AND v_match.match_number % 2 = 0 THEN p_winner_id
            ELSE player2_id
          END,
          updated_at = now()
        WHERE id = v_winner_next_match_id;
      END IF;
    ELSE
      -- Loser bracket final - advance to grand final
      SELECT id INTO v_winner_next_match_id
      FROM public.tournament_matches
      WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'grand_final'
      LIMIT 1;
      
      IF v_winner_next_match_id IS NOT NULL THEN
        UPDATE public.tournament_matches
        SET 
          player2_id = p_winner_id,  -- Loser bracket winner goes to player2
          updated_at = now()
        WHERE id = v_winner_next_match_id;
      END IF;
    END IF;
    
  -- Handle Grand Final
  ELSIF v_match.bracket_type = 'grand_final' THEN
    -- Tournament is complete
    UPDATE public.tournaments
    SET status = 'completed',
        updated_at = now()
    WHERE id = v_match.tournament_id;
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
      'bracket_type', v_match.bracket_type
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Double elimination advancement completed',
    'winner_next_match', v_winner_next_match_id,
    'loser_next_match', v_loser_next_match_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance double elimination: ' || SQLERRM
    );
END;
$$;