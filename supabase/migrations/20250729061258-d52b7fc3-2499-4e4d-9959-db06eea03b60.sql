-- Update advancement function to handle SEMIFINAL to GRAND FINAL
CREATE OR REPLACE FUNCTION public.advance_winner_to_next_round_enhanced(
  p_match_id UUID,
  p_force_advance BOOLEAN DEFAULT FALSE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_match RECORD;
  v_tournament_type TEXT;
  v_next_match RECORD;
  v_loser_match RECORD;
  v_result JSONB;
  v_loser_id UUID;
BEGIN
  -- Get current match details
  SELECT * INTO v_match 
  FROM tournament_matches 
  WHERE id = p_match_id;
  
  IF v_match IS NULL THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Check if match has a winner
  IF v_match.winner_id IS NULL AND NOT p_force_advance THEN
    RETURN jsonb_build_object('error', 'Match has no winner');
  END IF;
  
  -- Get tournament type
  SELECT tournament_type INTO v_tournament_type
  FROM tournaments 
  WHERE id = v_match.tournament_id;
  
  IF v_tournament_type != 'double_elimination' THEN
    RETURN jsonb_build_object('error', 'This function only supports double elimination tournaments');
  END IF;
  
  -- Determine loser
  v_loser_id := CASE 
    WHEN v_match.winner_id = v_match.player1_id THEN v_match.player2_id
    ELSE v_match.player1_id
  END;
  
  -- Handle different bracket stages
  CASE v_match.bracket_type
    WHEN 'winners' THEN
      -- WINNERS BRACKET ADVANCEMENT
      IF v_match.round_number < 3 THEN
        -- Find next winners bracket match
        SELECT * INTO v_next_match
        FROM tournament_matches
        WHERE tournament_id = v_match.tournament_id
          AND bracket_type = 'winners'
          AND round_number = v_match.round_number + 1
          AND match_number = CEIL(v_match.match_number::NUMERIC / 2)
        LIMIT 1;
        
        IF v_next_match.id IS NOT NULL THEN
          -- Determine position in next match
          IF v_match.match_number % 2 = 1 THEN
            UPDATE tournament_matches 
            SET player1_id = v_match.winner_id
            WHERE id = v_next_match.id;
          ELSE
            UPDATE tournament_matches 
            SET player2_id = v_match.winner_id
            WHERE id = v_next_match.id;
          END IF;
        END IF;
      ELSIF v_match.round_number = 3 THEN
        -- Winners bracket finalists go to SEMIFINAL R250
        IF v_match.match_number = 1 THEN
          UPDATE tournament_matches 
          SET player1_id = v_match.winner_id
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 250
            AND match_number = 1;
        ELSIF v_match.match_number = 2 THEN
          UPDATE tournament_matches 
          SET player1_id = v_match.winner_id
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 250
            AND match_number = 2;
        END IF;
      END IF;
      
      -- Send loser to appropriate losers bracket
      IF v_match.round_number = 1 THEN
        -- Losers from WB R1 go to LBA R101
        IF v_match.match_number % 2 = 1 THEN
          UPDATE tournament_matches 
          SET player1_id = v_loser_id
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 101
            AND match_number = CEIL(v_match.match_number::NUMERIC / 2);
        ELSE
          UPDATE tournament_matches 
          SET player2_id = v_loser_id
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 101
            AND match_number = CEIL(v_match.match_number::NUMERIC / 2);
        END IF;
            
      ELSIF v_match.round_number = 2 THEN
        -- Losers from WB R2 go to LBB R201
        UPDATE tournament_matches 
        SET player1_id = v_loser_id
        WHERE tournament_id = v_match.tournament_id
          AND round_number = 201
          AND match_number = v_match.match_number;
          
      ELSIF v_match.round_number = 3 THEN
        -- Losers from WB R3 are eliminated (no more losers bracket for them)
        NULL;
      END IF;
      
    WHEN 'losers' THEN
      -- LOSERS BRACKET ADVANCEMENT
      IF v_match.match_stage = 'losers_branch_a' THEN
        IF v_match.round_number < 103 THEN
          -- Advance within LBA
          SELECT * INTO v_next_match
          FROM tournament_matches
          WHERE tournament_id = v_match.tournament_id
            AND bracket_type = 'losers'
            AND match_stage = 'losers_branch_a'
            AND round_number = v_match.round_number + 1
            AND match_number = CEIL(v_match.match_number::NUMERIC / 2)
          LIMIT 1;
          
          IF v_next_match.id IS NOT NULL THEN
            IF v_match.match_number % 2 = 1 THEN
              UPDATE tournament_matches 
              SET player1_id = v_match.winner_id
              WHERE id = v_next_match.id;
            ELSE
              UPDATE tournament_matches 
              SET player2_id = v_match.winner_id
              WHERE id = v_next_match.id;
            END IF;
          END IF;
        ELSIF v_match.round_number = 103 THEN
          -- LBA finalist goes to SEMIFINAL R250 M1 Player 2
          UPDATE tournament_matches 
          SET player2_id = v_match.winner_id
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 250
            AND match_number = 1;
        END IF;
        
      ELSIF v_match.match_stage = 'losers_branch_b' THEN
        IF v_match.round_number = 201 THEN
          -- Advance to LBB final
          SELECT * INTO v_next_match
          FROM tournament_matches
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 202
            AND match_number = 1
          LIMIT 1;
          
          IF v_next_match.id IS NOT NULL THEN
            IF v_match.match_number = 1 THEN
              UPDATE tournament_matches 
              SET player1_id = v_match.winner_id
              WHERE id = v_next_match.id;
            ELSE
              UPDATE tournament_matches 
              SET player2_id = v_match.winner_id
              WHERE id = v_next_match.id;
            END IF;
          END IF;
        ELSIF v_match.round_number = 202 THEN
          -- LBB finalist goes to SEMIFINAL R250 M2 Player 2
          UPDATE tournament_matches 
          SET player2_id = v_match.winner_id
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 250
            AND match_number = 2;
        END IF;
      END IF;
      
    WHEN 'semifinal' THEN
      -- SEMIFINAL TO GRAND FINAL ADVANCEMENT
      IF v_match.round_number = 250 THEN
        IF v_match.match_number = 1 THEN
          -- Semifinal M1 winner → Grand Final Player 1
          UPDATE tournament_matches 
          SET player1_id = v_match.winner_id,
              status = 'pending'
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 301
            AND match_number = 1;
        ELSIF v_match.match_number = 2 THEN
          -- Semifinal M2 winner → Grand Final Player 2
          UPDATE tournament_matches 
          SET player2_id = v_match.winner_id,
              status = 'scheduled'
          WHERE tournament_id = v_match.tournament_id
            AND round_number = 301
            AND match_number = 1;
        END IF;
      END IF;
      
    WHEN 'final' THEN
      -- GRAND FINAL HANDLING - TOURNAMENT COMPLETION
      IF v_match.round_number = 301 THEN
        -- Tournament completed - declare champion
        UPDATE tournaments 
        SET status = 'completed',
            completed_at = NOW()
        WHERE id = v_match.tournament_id;
        
        -- Log completion
        INSERT INTO tournament_automation_log (
          tournament_id, automation_type, status, details, completed_at
        ) VALUES (
          v_match.tournament_id, 'tournament_completion', 'completed',
          jsonb_build_object(
            'champion_id', v_match.winner_id,
            'final_match_id', v_match.id,
            'completion_time', NOW()
          ),
          NOW()
        );
      END IF;
  END CASE;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_advanced', true,
    'message', 'Winner successfully advanced'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;