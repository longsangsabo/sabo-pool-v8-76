-- Fix advance_winner_to_next_round_enhanced function for single elimination
CREATE OR REPLACE FUNCTION public.advance_winner_to_next_round_enhanced(p_match_id uuid, p_force_advance boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_match RECORD;
  v_next_match RECORD;
  v_tournament RECORD;
  v_next_match_number INTEGER;
  v_slot_position TEXT;
  v_total_rounds INTEGER;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;

  IF v_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No winner set for this match');
  END IF;

  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;

  -- Get total rounds for this tournament
  SELECT MAX(round_number) INTO v_total_rounds
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id;

  -- Check if this is the final match
  IF v_match.round_number = v_total_rounds THEN
    -- This is the final match - tournament should be completed
    UPDATE tournaments 
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Tournament completed',
      'tournament_winner', v_match.winner_id,
      'is_final_match', true,
      'tournament_completed', true
    );
  END IF;

  -- For non-final matches, advance winner to next round
  -- Calculate next match position
  v_next_match_number := CEIL(v_match.match_number::DECIMAL / 2);
  v_slot_position := CASE WHEN v_match.match_number % 2 = 1 THEN 'player1_id' ELSE 'player2_id' END;
  
  -- Find the next round match
  SELECT * INTO v_next_match
  FROM tournament_matches
  WHERE tournament_id = v_match.tournament_id
  AND round_number = v_match.round_number + 1
  AND match_number = v_next_match_number;
  
  IF v_next_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Next round match not found');
  END IF;

  -- Advance winner to next match
  IF v_slot_position = 'player1_id' THEN
    UPDATE tournament_matches
    SET player1_id = v_match.winner_id,
        status = CASE 
          WHEN player2_id IS NOT NULL THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  ELSE
    UPDATE tournament_matches
    SET player2_id = v_match.winner_id,
        status = CASE 
          WHEN player1_id IS NOT NULL THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'winner_advanced', true,
    'next_match_id', v_next_match.id,
    'slot_position', v_slot_position,
    'winner_id', v_match.winner_id,
    'advanced_to_round', v_match.round_number + 1,
    'advanced_to_match', v_next_match_number,
    'is_final_match', false,
    'tournament_completed', false
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', format('Failed to advance winner: %s', SQLERRM)
    );
END;
$function$;