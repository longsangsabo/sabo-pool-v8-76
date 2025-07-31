-- Fix ambiguous column reference
CREATE OR REPLACE FUNCTION complete_rebuild_double_elimination()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  match_rec RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
BEGIN
  -- Clear all non-completed matches first
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, status = 'pending', winner_id = NULL
  WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
  AND status != 'completed';

  -- Process completed winner bracket matches in order
  FOR match_rec IN 
    SELECT tm.id, tm.player1_id, tm.player2_id, tm.winner_id, tm.round_number, tm.match_number
    FROM tournament_matches tm
    WHERE tm.tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
    AND tm.bracket_type = 'winner'
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
    ORDER BY tm.round_number, tm.match_number
  LOOP
    v_winner_id := match_rec.winner_id;
    v_loser_id := CASE 
      WHEN match_rec.winner_id = match_rec.player1_id THEN match_rec.player2_id
      ELSE match_rec.player1_id
    END;
    
    -- Advance winner to next round
    IF match_rec.round_number = 1 THEN
      -- Round 1 -> Round 2 winner bracket
      UPDATE tournament_matches 
      SET player1_id = CASE 
        WHEN player1_id IS NULL AND match_rec.match_number IN (1,2) THEN v_winner_id
        WHEN player1_id IS NULL AND match_rec.match_number IN (5,6) THEN v_winner_id
        ELSE player1_id
      END,
      player2_id = CASE 
        WHEN player2_id IS NULL AND match_rec.match_number IN (3,4) THEN v_winner_id
        WHEN player2_id IS NULL AND match_rec.match_number IN (7,8) THEN v_winner_id
        ELSE player2_id
      END
      WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
      AND bracket_type = 'winner'
      AND round_number = 2
      AND match_number = CASE 
        WHEN match_rec.match_number IN (1,2) THEN 1
        WHEN match_rec.match_number IN (3,4) THEN 2
        WHEN match_rec.match_number IN (5,6) THEN 3
        WHEN match_rec.match_number IN (7,8) THEN 4
      END;
      
    ELSIF match_rec.round_number = 2 THEN
      -- Round 2 -> Round 3 winner bracket
      UPDATE tournament_matches 
      SET player1_id = CASE 
        WHEN player1_id IS NULL AND match_rec.match_number IN (1,2) THEN v_winner_id
        ELSE player1_id
      END,
      player2_id = CASE 
        WHEN player2_id IS NULL AND match_rec.match_number IN (3,4) THEN v_winner_id
        ELSE player2_id
      END
      WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
      AND bracket_type = 'winner'
      AND round_number = 3
      AND match_number = CASE 
        WHEN match_rec.match_number IN (1,2) THEN 1
        WHEN match_rec.match_number IN (3,4) THEN 2
      END;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Double elimination bracket rebuilt'
  );
END;
$$;

-- Execute rebuild
SELECT complete_rebuild_double_elimination();