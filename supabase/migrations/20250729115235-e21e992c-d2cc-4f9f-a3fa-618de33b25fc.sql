-- Fix advance_double_elimination_v9 function to correct Winners Bracket pairing
CREATE OR REPLACE FUNCTION public.advance_double_elimination_v9(
  p_tournament_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_tournament_record RECORD;
  v_completed_match RECORD;
  v_next_match RECORD;
  v_advancement_count INTEGER := 0;
  v_error_details JSONB := '[]'::jsonb;
  v_current_round INTEGER;
  v_next_round INTEGER;
  v_winners_bracket_updated INTEGER := 0;
  v_losers_bracket_updated INTEGER := 0;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament_record 
  FROM tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;

  -- Process Winners Bracket advancement
  FOR v_completed_match IN
    SELECT * FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'winners'
      AND status = 'completed'
      AND winner_id IS NOT NULL
      AND round_number <= 4 -- Only process first few rounds
    ORDER BY round_number, match_number
  LOOP
    v_current_round := v_completed_match.round_number;
    v_next_round := v_current_round + 1;
    
    -- Fixed Winners Bracket pairing logic
    IF v_current_round = 1 THEN
      -- Round 1 to Round 2: Match(2n-1) winner vs Match(2n) winner
      DECLARE
        v_pair_match_number INTEGER;
        v_next_match_number INTEGER;
        v_pair_winner_id UUID;
        v_slot_position TEXT;
      BEGIN
        -- Determine the pair match and next match
        IF v_completed_match.match_number % 2 = 1 THEN
          -- Odd match number (1,3,5,7) - this is the first match of a pair
          v_pair_match_number := v_completed_match.match_number + 1;
          v_next_match_number := (v_completed_match.match_number + 1) / 2;
          v_slot_position := 'player1';
        ELSE
          -- Even match number (2,4,6,8) - this is the second match of a pair
          v_pair_match_number := v_completed_match.match_number - 1;
          v_next_match_number := v_completed_match.match_number / 2;
          v_slot_position := 'player2';
        END IF;
        
        -- Get the winner of the pair match
        SELECT winner_id INTO v_pair_winner_id
        FROM tournament_matches
        WHERE tournament_id = p_tournament_id
          AND bracket_type = 'winners'
          AND round_number = v_current_round
          AND match_number = v_pair_match_number
          AND status = 'completed';
        
        -- Update the next round match if both winners are available
        IF v_pair_winner_id IS NOT NULL THEN
          IF v_slot_position = 'player1' THEN
            -- Update with current match winner as player1, pair winner as player2
            UPDATE tournament_matches
            SET player1_id = v_completed_match.winner_id,
                player2_id = v_pair_winner_id,
                status = 'ready',
                updated_at = NOW()
            WHERE tournament_id = p_tournament_id
              AND bracket_type = 'winners'
              AND round_number = v_next_round
              AND match_number = v_next_match_number
              AND (player1_id IS NULL OR player2_id IS NULL);
          ELSE
            -- Update with pair winner as player1, current match winner as player2
            UPDATE tournament_matches
            SET player1_id = v_pair_winner_id,
                player2_id = v_completed_match.winner_id,
                status = 'ready',
                updated_at = NOW()
            WHERE tournament_id = p_tournament_id
              AND bracket_type = 'winners'
              AND round_number = v_next_round
              AND match_number = v_next_match_number
              AND (player1_id IS NULL OR player2_id IS NULL);
          END IF;
          
          v_winners_bracket_updated := v_winners_bracket_updated + 1;
        END IF;
      END;
    ELSE
      -- For rounds 2+, advance winner to next round using standard logic
      SELECT * INTO v_next_match
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id
        AND bracket_type = 'winners'
        AND round_number = v_next_round
        AND match_number = (v_completed_match.match_number + 1) / 2;
      
      IF FOUND THEN
        -- Determine which slot to fill
        IF v_next_match.player1_id IS NULL THEN
          UPDATE tournament_matches
          SET player1_id = v_completed_match.winner_id,
              status = CASE WHEN player2_id IS NOT NULL THEN 'ready' ELSE 'scheduled' END,
              updated_at = NOW()
          WHERE id = v_next_match.id;
        ELSIF v_next_match.player2_id IS NULL THEN
          UPDATE tournament_matches
          SET player2_id = v_completed_match.winner_id,
              status = 'ready',
              updated_at = NOW()
          WHERE id = v_next_match.id;
        END IF;
        
        v_winners_bracket_updated := v_winners_bracket_updated + 1;
      END IF;
    END IF;
    
    v_advancement_count := v_advancement_count + 1;
  END LOOP;

  -- Process Losers Bracket advancement (existing logic)
  FOR v_completed_match IN
    SELECT * FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'losers'
      AND status = 'completed'
      AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    -- Advance winner to next losers bracket match
    SELECT * INTO v_next_match
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id
      AND bracket_type = 'losers'
      AND round_number = v_completed_match.round_number + 1
      AND match_number = (v_completed_match.match_number + 1) / 2;
    
    IF FOUND THEN
      IF v_next_match.player1_id IS NULL THEN
        UPDATE tournament_matches
        SET player1_id = v_completed_match.winner_id,
            status = CASE WHEN player2_id IS NOT NULL THEN 'ready' ELSE 'scheduled' END,
            updated_at = NOW()
        WHERE id = v_next_match.id;
      ELSIF v_next_match.player2_id IS NULL THEN
        UPDATE tournament_matches
        SET player2_id = v_completed_match.winner_id,
            status = 'ready',
            updated_at = NOW()
        WHERE id = v_next_match.id;
      END IF;
      
      v_losers_bracket_updated := v_losers_bracket_updated + 1;
    END IF;
    
    v_advancement_count := v_advancement_count + 1;
  END LOOP;

  -- Additional validation: Fix any matches with duplicate players
  UPDATE tournament_matches
  SET player2_id = NULL,
      status = 'scheduled'
  WHERE tournament_id = p_tournament_id
    AND player1_id = player2_id
    AND player1_id IS NOT NULL;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'advancement_count', v_advancement_count,
    'winners_bracket_updated', v_winners_bracket_updated,
    'losers_bracket_updated', v_losers_bracket_updated,
    'message', format('Advanced %s matches successfully', v_advancement_count)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tournament_id', p_tournament_id
    );
END;
$$;