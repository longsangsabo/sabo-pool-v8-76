-- Add simplified double elimination functions if not exists
CREATE OR REPLACE FUNCTION public.advance_winner_simplified(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_result JSONB;
  v_winner_id UUID;
  v_loser_id UUID;
  v_next_match RECORD;
  v_winner_advanced BOOLEAN := FALSE;
  v_loser_placed BOOLEAN := FALSE;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM tournament_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament FROM tournaments WHERE id = v_match.tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get winner and loser from match
  v_winner_id := v_match.winner_id;
  IF v_match.player1_id = v_winner_id THEN
    v_loser_id := v_match.player2_id;
  ELSE
    v_loser_id := v_match.player1_id;
  END IF;
  
  -- Advance winner based on bracket type
  IF v_match.bracket_type = 'winners' THEN
    -- Winners bracket: advance to next winners round
    SELECT * INTO v_next_match
    FROM tournament_matches 
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'winners'
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number ASC
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
        v_winner_advanced := TRUE;
      ELSIF v_next_match.player2_id IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
        v_winner_advanced := TRUE;
      END IF;
    END IF;
    
    -- Place loser in appropriate losers bracket
    IF v_match.round_number = 1 THEN
      -- Round 1 losers go to losers_branch_a
      SELECT * INTO v_next_match
      FROM tournament_matches 
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'losers_branch_a'
        AND round_number = 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number ASC
      LIMIT 1;
    ELSE
      -- Round 2+ losers go to losers_branch_b
      SELECT * INTO v_next_match
      FROM tournament_matches 
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'losers_branch_b'
        AND round_number = 1
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number ASC
      LIMIT 1;
    END IF;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_loser_id, updated_at = NOW()
        WHERE id = v_next_match.id;
        v_loser_placed := TRUE;
      ELSIF v_next_match.player2_id IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_loser_id, updated_at = NOW()
        WHERE id = v_next_match.id;
        v_loser_placed := TRUE;
      END IF;
    END IF;
    
  ELSIF v_match.bracket_type IN ('losers_branch_a', 'losers_branch_b') THEN
    -- Losers bracket: advance to next round or to semifinal
    SELECT * INTO v_next_match
    FROM tournament_matches 
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = v_match.bracket_type
      AND round_number = v_match.round_number + 1
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number ASC
    LIMIT 1;
    
    IF NOT FOUND THEN
      -- No next round in same bracket, advance to semifinal
      SELECT * INTO v_next_match
      FROM tournament_matches 
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'semifinal'
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY match_number ASC
      LIMIT 1;
    END IF;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
        v_winner_advanced := TRUE;
      ELSIF v_next_match.player2_id IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
        v_winner_advanced := TRUE;
      END IF;
    END IF;
    
  ELSIF v_match.bracket_type = 'semifinal' THEN
    -- Semifinal: advance to final
    SELECT * INTO v_next_match
    FROM tournament_matches 
    WHERE tournament_id = v_match.tournament_id
      AND bracket_type = 'final'
      AND (player1_id IS NULL OR player2_id IS NULL)
    ORDER BY match_number ASC
    LIMIT 1;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
        v_winner_advanced := TRUE;
      ELSIF v_next_match.player2_id IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
        v_winner_advanced := TRUE;
      END IF;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'match_id', p_match_id,
    'bracket_type', v_match.bracket_type,
    'winner_id', v_winner_id,
    'loser_id', v_loser_id,
    'winner_advanced', v_winner_advanced,
    'loser_placed', v_loser_placed,
    'tournament_id', v_match.tournament_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'match_id', p_match_id
    );
END;
$function$;