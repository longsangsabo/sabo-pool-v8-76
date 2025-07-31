-- Fix the bracket advancement logic to prevent same player assignment
CREATE OR REPLACE FUNCTION public.submit_double_elimination_score_v9(
  p_match_id uuid,
  p_player1_score integer,
  p_player2_score integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_match RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_tournament_id UUID;
  v_finals_completed BOOLEAN;
  v_next_match_id UUID;
BEGIN
  -- Get match details with correct column names
  SELECT 
    tournament_id,
    player1_id,
    player2_id,
    bracket_type,
    round_number,
    match_number,
    status
  INTO v_match
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found', 'success', false);
  END IF;
  
  IF v_match.status = 'completed' THEN
    RETURN jsonb_build_object('error', 'Match already completed', 'success', false);
  END IF;
  
  -- Determine winner and loser
  IF p_player1_score > p_player2_score THEN
    v_winner_id := v_match.player1_id;
    v_loser_id := v_match.player2_id;
  ELSE
    v_winner_id := v_match.player2_id;
    v_loser_id := v_match.player1_id;
  END IF;
  
  v_tournament_id := v_match.tournament_id;
  
  -- Update match with correct column names
  UPDATE tournament_matches 
  SET 
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    winner_id = v_winner_id,
    status = 'completed',
    actual_end_time = NOW(),
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Handle advancement based on bracket type
  IF v_match.bracket_type = 'winners' THEN
    -- Find the correct next match for winner advancement
    SELECT id INTO v_next_match_id
    FROM tournament_matches 
    WHERE tournament_id = v_tournament_id
      AND bracket_type = 'winners'
      AND round_number = v_match.round_number + 1
      AND match_number = CEILING(v_match.match_number::numeric / 2)
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      -- Advance winner to next winners round - ensure no duplicate players
      UPDATE tournament_matches 
      SET 
        player1_id = CASE 
          WHEN player1_id IS NULL AND player2_id != v_winner_id THEN v_winner_id
          ELSE player1_id
        END,
        player2_id = CASE 
          WHEN player2_id IS NULL AND player1_id != v_winner_id THEN v_winner_id
          ELSE player2_id
        END,
        updated_at = NOW()
      WHERE id = v_next_match_id
        AND (player1_id IS NULL OR player2_id IS NULL)
        AND NOT (player1_id = v_winner_id OR player2_id = v_winner_id);
    END IF;
    
    -- Send loser to losers bracket (specific logic needed based on tournament structure)
    -- For now, we'll implement basic losers bracket placement
    
  ELSIF v_match.bracket_type = 'losers' THEN
    -- Find next available losers bracket match
    SELECT id INTO v_next_match_id
    FROM tournament_matches 
    WHERE tournament_id = v_tournament_id
      AND bracket_type = 'losers'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
      AND NOT (player1_id = v_winner_id OR player2_id = v_winner_id)
    ORDER BY match_number
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      UPDATE tournament_matches 
      SET 
        player1_id = CASE 
          WHEN player1_id IS NULL THEN v_winner_id
          ELSE player1_id
        END,
        player2_id = CASE 
          WHEN player2_id IS NULL AND player1_id != v_winner_id THEN v_winner_id
          ELSE player2_id
        END,
        updated_at = NOW()
      WHERE id = v_next_match_id;
    END IF;
    
  ELSIF v_match.bracket_type = 'semifinals' THEN
    -- Advance to finals
    SELECT id INTO v_next_match_id
    FROM tournament_matches 
    WHERE tournament_id = v_tournament_id
      AND bracket_type = 'finals'
      AND (player1_id IS NULL OR player2_id IS NULL)
      AND NOT (player1_id = v_winner_id OR player2_id = v_winner_id)
    LIMIT 1;
    
    IF v_next_match_id IS NOT NULL THEN
      UPDATE tournament_matches 
      SET 
        player1_id = CASE 
          WHEN player1_id IS NULL THEN v_winner_id
          ELSE player1_id
        END,
        player2_id = CASE 
          WHEN player2_id IS NULL AND player1_id != v_winner_id THEN v_winner_id
          ELSE player2_id
        END,
        updated_at = NOW()
      WHERE id = v_next_match_id;
    END IF;
    
  END IF;
  
  -- Check if tournament is complete
  SELECT COUNT(*) = 0 INTO v_finals_completed
  FROM tournament_matches
  WHERE tournament_id = v_tournament_id
    AND bracket_type = 'finals'
    AND status != 'completed';
    
  IF v_finals_completed THEN
    UPDATE tournaments 
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = v_tournament_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_winner_id,
    'advancement_completed', true
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'success', false,
      'detail', SQLSTATE
    );
END;
$function$;