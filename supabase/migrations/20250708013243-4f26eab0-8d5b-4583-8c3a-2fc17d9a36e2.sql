-- Create advance_tournament_winner function for match progression
CREATE OR REPLACE FUNCTION public.advance_tournament_winner(
  p_match_id UUID,
  p_tournament_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_completed_match RECORD;
  v_next_match RECORD;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_winner_seed INTEGER;
  v_advancement_result JSONB;
BEGIN
  -- Get the completed match details
  SELECT * INTO v_completed_match
  FROM public.tournament_matches 
  WHERE id = p_match_id AND tournament_id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  IF v_completed_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Match has no winner set');
  END IF;
  
  -- Calculate next round and match number for winner advancement
  v_next_round := v_completed_match.round_number + 1;
  v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
  
  -- Find the next round match where this winner should advance
  SELECT * INTO v_next_match
  FROM public.tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = v_next_round 
    AND match_number = v_next_match_number;
  
  IF FOUND THEN
    -- Determine if winner goes to player1 or player2 slot in next match
    -- Odd match numbers advance to player1, even numbers to player2
    IF v_completed_match.match_number % 2 = 1 THEN
      -- Odd match winner goes to player1 slot
      UPDATE public.tournament_matches 
      SET player1_id = v_completed_match.winner_id,
          updated_at = now()
      WHERE id = v_next_match.id;
      
      v_advancement_result := jsonb_build_object(
        'advanced_to_slot', 'player1',
        'next_match_id', v_next_match.id,
        'next_round', v_next_round,
        'next_match_number', v_next_match_number
      );
    ELSE
      -- Even match winner goes to player2 slot  
      UPDATE public.tournament_matches 
      SET player2_id = v_completed_match.winner_id,
          updated_at = now()
      WHERE id = v_next_match.id;
      
      v_advancement_result := jsonb_build_object(
        'advanced_to_slot', 'player2',
        'next_match_id', v_next_match.id,
        'next_round', v_next_round,
        'next_match_number', v_next_match_number
      );
    END IF;
    
    -- Log the advancement
    INSERT INTO public.system_logs (log_type, message, metadata)
    VALUES (
      'tournament_advancement',
      format('Player advanced from R%s M%s to R%s M%s', 
        v_completed_match.round_number, 
        v_completed_match.match_number,
        v_next_round, 
        v_next_match_number),
      jsonb_build_object(
        'tournament_id', p_tournament_id,
        'completed_match_id', p_match_id,
        'winner_id', v_completed_match.winner_id,
        'next_match_id', v_next_match.id
      )
    );
    
  ELSE
    -- This was probably the final match
    v_advancement_result := jsonb_build_object(
      'tournament_complete', true,
      'champion_id', v_completed_match.winner_id
    );
    
    -- Update tournament status if final
    IF v_completed_match.round_number = (
      SELECT MAX(round_number) FROM public.tournament_matches WHERE tournament_id = p_tournament_id
    ) THEN
      UPDATE public.tournaments 
      SET status = 'completed',
          updated_at = now()
      WHERE id = p_tournament_id;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_completed_match.winner_id,
    'advancement', v_advancement_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM
    );
END;
$$;