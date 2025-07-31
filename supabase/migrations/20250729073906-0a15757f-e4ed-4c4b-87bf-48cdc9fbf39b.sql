-- Fix auto-advance logic for Loser's Branch A
-- First, let's check and fix the advance_winner_to_next_round_enhanced function for Loser's Branch A

CREATE OR REPLACE FUNCTION public.advance_winner_to_next_round_enhanced(
  p_match_id uuid,
  p_force_advance boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match RECORD;
  v_next_match RECORD;
  v_result jsonb;
  v_tournament_type text;
  v_advancement_success boolean := false;
BEGIN
  -- Get match details with tournament type
  SELECT 
    tm.*,
    t.tournament_type,
    t.name as tournament_name
  INTO v_match
  FROM tournament_matches tm
  JOIN tournaments t ON tm.tournament_id = t.id
  WHERE tm.id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;
  
  -- Only advance if match is completed with a winner
  IF v_match.status != 'completed' OR v_match.winner_id IS NULL THEN
    IF NOT p_force_advance THEN
      RETURN jsonb_build_object('success', false, 'error', 'Match not completed or no winner');
    END IF;
  END IF;
  
  v_tournament_type := v_match.tournament_type;
  
  -- Handle double elimination advancement
  IF v_tournament_type = 'double_elimination' THEN
    -- Handle Winner's Bracket advancement
    IF v_match.bracket_type = 'winners' THEN
      -- Find next match in Winner's Bracket
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'winners'
        AND round_number = v_match.round_number + 1
        AND (
          (v_match.match_number <= 2 AND match_number = 1) OR
          (v_match.match_number > 2 AND match_number = CEIL(v_match.match_number / 2.0))
        );
      
      IF FOUND THEN
        -- Place winner in next Winner's Bracket match
        IF v_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_match.winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
          v_advancement_success := true;
        ELSIF v_next_match.player2_id IS NULL THEN
          UPDATE tournament_matches 
          SET player2_id = v_match.winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
          v_advancement_success := true;
        END IF;
        
        -- Move loser to Loser's Bracket
        DECLARE
          v_loser_id uuid;
          v_loser_match RECORD;
        BEGIN
          v_loser_id := CASE WHEN v_match.player1_id = v_match.winner_id THEN v_match.player2_id ELSE v_match.player1_id END;
          
          -- Find appropriate spot in Loser's Bracket based on round
          IF v_match.round_number = 1 THEN
            -- Round 1 winners losers go to Round 101 (Loser's Round 1)
            SELECT * INTO v_loser_match
            FROM tournament_matches
            WHERE tournament_id = v_match.tournament_id
              AND bracket_type = 'losers'
              AND round_number = 101
              AND (player1_id IS NULL OR player2_id IS NULL)
            ORDER BY match_number
            LIMIT 1;
          ELSIF v_match.round_number = 2 THEN
            -- Round 2 winners losers go to Round 102 (Loser's Round 2)
            SELECT * INTO v_loser_match
            FROM tournament_matches
            WHERE tournament_id = v_match.tournament_id
              AND bracket_type = 'losers'
              AND round_number = 102
              AND (player1_id IS NULL OR player2_id IS NULL)
            ORDER BY match_number
            LIMIT 1;
          ELSIF v_match.round_number >= 3 THEN
            -- Later rounds go to subsequent Loser's rounds
            SELECT * INTO v_loser_match
            FROM tournament_matches
            WHERE tournament_id = v_match.tournament_id
              AND bracket_type = 'losers'
              AND round_number = 100 + v_match.round_number
              AND (player1_id IS NULL OR player2_id IS NULL)
            ORDER BY match_number
            LIMIT 1;
          END IF;
          
          -- Place loser in Loser's Bracket
          IF FOUND THEN
            IF v_loser_match.player1_id IS NULL THEN
              UPDATE tournament_matches 
              SET player1_id = v_loser_id, updated_at = NOW()
              WHERE id = v_loser_match.id;
            ELSIF v_loser_match.player2_id IS NULL THEN
              UPDATE tournament_matches 
              SET player2_id = v_loser_id, updated_at = NOW()
              WHERE id = v_loser_match.id;
            END IF;
          END IF;
        END;
      END IF;
      
    -- Handle Loser's Bracket advancement - THIS IS THE CRITICAL FIX
    ELSIF v_match.bracket_type = 'losers' THEN
      -- For Loser's Branch A and other loser bracket matches
      -- The winner of the current match should advance to the next round
      
      -- Find next match in Loser's Bracket
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = v_match.tournament_id
        AND bracket_type = 'losers'
        AND round_number > v_match.round_number
        AND (player1_id IS NULL OR player2_id IS NULL)
      ORDER BY round_number, match_number
      LIMIT 1;
      
      IF FOUND THEN
        -- Place THE ACTUAL WINNER (not some other player) in next Loser's match
        IF v_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches 
          SET player1_id = v_match.winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
          v_advancement_success := true;
        ELSIF v_next_match.player2_id IS NULL THEN
          UPDATE tournament_matches 
          SET player2_id = v_match.winner_id, updated_at = NOW()
          WHERE id = v_next_match.id;
          v_advancement_success := true;
        END IF;
      END IF;
      
    END IF;
    
  -- Handle single elimination (existing logic)
  ELSE
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = v_match.tournament_id
      AND round_number = v_match.round_number + 1
      AND (
        (v_match.match_number <= 2 AND match_number = 1) OR
        (v_match.match_number > 2 AND match_number = CEIL(v_match.match_number / 2.0))
      );
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches 
        SET player1_id = v_match.winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
        v_advancement_success := true;
      ELSIF v_next_match.player2_id IS NULL THEN
        UPDATE tournament_matches 
        SET player2_id = v_match.winner_id, updated_at = NOW()
        WHERE id = v_next_match.id;
        v_advancement_success := true;
      END IF;
    END IF;
  END IF;
  
  v_result := jsonb_build_object(
    'success', v_advancement_success,
    'match_id', p_match_id,
    'winner_id', v_match.winner_id,
    'tournament_type', v_tournament_type,
    'bracket_type', v_match.bracket_type,
    'round_number', v_match.round_number,
    'next_round', CASE WHEN v_next_match.id IS NOT NULL THEN v_next_match.round_number ELSE NULL END,
    'message', CASE 
      WHEN v_advancement_success THEN 'Winner advanced successfully'
      ELSE 'No advancement needed or possible'
    END
  );
  
  -- Log advancement
  INSERT INTO tournament_automation_log (
    tournament_id, automation_type, status, details, completed_at
  ) VALUES (
    v_match.tournament_id, 'winner_advancement', 
    CASE WHEN v_advancement_success THEN 'completed' ELSE 'no_action' END,
    v_result,
    CASE WHEN v_advancement_success THEN NOW() ELSE NULL END
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'match_id', p_match_id
    );
END;
$$;