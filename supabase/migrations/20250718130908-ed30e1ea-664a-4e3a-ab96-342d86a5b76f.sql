-- Drop duplicate advance_winner_to_next_round functions and keep only the correct one
DROP FUNCTION IF EXISTS public.advance_winner_to_next_round(uuid);
DROP FUNCTION IF EXISTS public.advance_winner_to_next_round(uuid, boolean);

-- Recreate the correct function
CREATE OR REPLACE FUNCTION public.advance_winner_to_next_round(p_match_id uuid, p_force_advance boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_next_match RECORD;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_is_player1_slot BOOLEAN;
  v_max_rounds INTEGER;
BEGIN
  -- Get completed match details
  SELECT * INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id 
    AND (status = 'completed' OR p_force_advance = TRUE)
    AND winner_id IS NOT NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found or not completed');
  END IF;
  
  -- Calculate next round and match position
  v_next_round := v_match.round_number + 1;
  v_next_match_number := CEIL(v_match.match_number::NUMERIC / 2);
  
  -- Get max rounds for this tournament
  SELECT MAX(round_number) INTO v_max_rounds
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id;
  
  -- Check if this was the final match
  IF v_match.round_number >= v_max_rounds THEN
    -- This was the final match
    UPDATE tournaments 
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_match.tournament_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'tournament_complete', true,
      'champion_id', v_match.winner_id,
      'message', 'Tournament completed successfully'
    );
  END IF;
  
  -- Find next round match
  SELECT * INTO v_next_match
  FROM tournament_matches 
  WHERE tournament_id = v_match.tournament_id 
    AND round_number = v_next_round 
    AND match_number = v_next_match_number;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Next round match not found');
  END IF;
  
  -- Fixed logic: for single elimination bracket progression
  -- Match 1,2 -> Match 1 (winners from matches 1,2 meet in semifinals match 1)
  -- Match 3,4 -> Match 2 (winners from matches 3,4 meet in semifinals match 2)
  v_is_player1_slot := (v_match.match_number % 2 = 1);
  
  -- Clear any duplicate assignments first
  IF v_is_player1_slot THEN
    -- Winner from odd numbered matches goes to player1 slot
    UPDATE tournament_matches 
    SET player1_id = v_match.winner_id,
        player2_id = CASE 
          WHEN player2_id = v_match.winner_id THEN NULL 
          ELSE player2_id 
        END,
        status = CASE 
          WHEN player2_id IS NOT NULL AND player2_id != v_match.winner_id THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  ELSE
    -- Winner from even numbered matches goes to player2 slot
    UPDATE tournament_matches 
    SET player2_id = v_match.winner_id,
        player1_id = CASE 
          WHEN player1_id = v_match.winner_id THEN NULL 
          ELSE player1_id 
        END,
        status = CASE 
          WHEN player1_id IS NOT NULL AND player1_id != v_match.winner_id THEN 'scheduled'
          ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = v_next_match.id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'advanced_to_round', v_next_round,
    'advanced_to_match', v_next_match_number,
    'winner_id', v_match.winner_id,
    'slot', CASE WHEN v_is_player1_slot THEN 'player1' ELSE 'player2' END,
    'message', 'Winner advanced to next round successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM
    );
END;
$$;