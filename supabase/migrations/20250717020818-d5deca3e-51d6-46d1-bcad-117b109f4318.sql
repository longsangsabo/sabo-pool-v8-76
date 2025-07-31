-- Clear tất cả matches trống và rebuild lại từ completed matches
UPDATE tournament_matches 
SET player1_id = NULL, player2_id = NULL, status = 'pending', winner_id = NULL
WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
AND status = 'pending'
AND (player1_id IS NULL OR player2_id IS NULL);

-- Tạo function hoàn toàn mới để rebuild từ đầu
CREATE OR REPLACE FUNCTION complete_rebuild_double_elimination()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  match_rec RECORD;
  winner_id UUID;
  loser_id UUID;
  result_json jsonb;
BEGIN
  -- Clear all non-completed matches first
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, status = 'pending', winner_id = NULL
  WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
  AND status != 'completed';

  -- Process completed winner bracket matches in order
  FOR match_rec IN 
    SELECT id, player1_id, player2_id, winner_id, round_number, match_number
    FROM tournament_matches 
    WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
    AND bracket_type = 'winner'
    AND status = 'completed'
    AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    winner_id := match_rec.winner_id;
    loser_id := CASE 
      WHEN match_rec.winner_id = match_rec.player1_id THEN match_rec.player2_id
      ELSE match_rec.player1_id
    END;
    
    -- Advance winner to next round
    IF match_rec.round_number = 1 THEN
      -- Round 1 -> Round 2 winner bracket
      UPDATE tournament_matches 
      SET player1_id = CASE 
        WHEN player1_id IS NULL AND match_rec.match_number IN (1,2) THEN winner_id
        ELSE player1_id
      END,
      player2_id = CASE 
        WHEN player2_id IS NULL AND match_rec.match_number IN (3,4) THEN winner_id
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
      
      -- Send loser to loser bracket round 1
      UPDATE tournament_matches 
      SET player1_id = CASE 
        WHEN player1_id IS NULL THEN loser_id
        ELSE player1_id
      END,
      player2_id = CASE 
        WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN loser_id
        ELSE player2_id
      END
      WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
      AND bracket_type = 'loser'
      AND round_number = 1
      AND id IN (
        SELECT id FROM tournament_matches 
        WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
        AND bracket_type = 'loser'
        AND round_number = 1
        AND (player1_id IS NULL OR player2_id IS NULL)
        ORDER BY match_number
        LIMIT 1
      );
      
    ELSIF match_rec.round_number = 2 THEN
      -- Round 2 -> Round 3 winner bracket
      UPDATE tournament_matches 
      SET player1_id = CASE 
        WHEN player1_id IS NULL AND match_rec.match_number IN (1,2) THEN winner_id
        ELSE player1_id
      END,
      player2_id = CASE 
        WHEN player2_id IS NULL AND match_rec.match_number IN (3,4) THEN winner_id
        ELSE player2_id
      END
      WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
      AND bracket_type = 'winner'
      AND round_number = 3
      AND match_number = CASE 
        WHEN match_rec.match_number IN (1,2) THEN 1
        WHEN match_rec.match_number IN (3,4) THEN 2
      END;
      
      -- Send loser to loser bracket round 3
      UPDATE tournament_matches 
      SET player1_id = CASE 
        WHEN player1_id IS NULL THEN loser_id
        ELSE player1_id
      END,
      player2_id = CASE 
        WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN loser_id
        ELSE player2_id
      END
      WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
      AND bracket_type = 'loser'
      AND round_number = 3
      AND id IN (
        SELECT id FROM tournament_matches 
        WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
        AND bracket_type = 'loser'
        AND round_number = 3
        AND (player1_id IS NULL OR player2_id IS NULL)
        ORDER BY match_number
        LIMIT 1
      );
    END IF;
  END LOOP;

  -- Process completed loser bracket matches  
  FOR match_rec IN 
    SELECT id, player1_id, player2_id, winner_id, round_number, match_number
    FROM tournament_matches 
    WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
    AND bracket_type = 'loser'
    AND status = 'completed'
    AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    winner_id := match_rec.winner_id;
    
    -- Advance winner to next loser bracket round
    IF match_rec.round_number < 5 THEN
      UPDATE tournament_matches 
      SET player1_id = CASE 
        WHEN player1_id IS NULL THEN winner_id
        ELSE player1_id
      END,
      player2_id = CASE 
        WHEN player1_id IS NOT NULL AND player2_id IS NULL THEN winner_id
        ELSE player2_id
      END
      WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
      AND bracket_type = 'loser'
      AND round_number = match_rec.round_number + 1
      AND id IN (
        SELECT id FROM tournament_matches 
        WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
        AND bracket_type = 'loser'
        AND round_number = match_rec.round_number + 1
        AND (player1_id IS NULL OR player2_id IS NULL)
        ORDER BY match_number
        LIMIT 1
      );
    ELSE
      -- Loser bracket final -> Grand final
      UPDATE tournament_matches 
      SET player2_id = winner_id
      WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
      AND bracket_type = 'grand_final';
    END IF;
  END LOOP;

  -- Set winner bracket final winner to grand final
  UPDATE tournament_matches 
  SET player1_id = (
    SELECT winner_id FROM tournament_matches 
    WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
    AND bracket_type = 'winner'
    AND round_number = 3
    AND status = 'completed'
    LIMIT 1
  )
  WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
  AND bracket_type = 'grand_final';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Double elimination bracket completely rebuilt'
  );
END;
$$;

-- Execute complete rebuild
SELECT complete_rebuild_double_elimination();