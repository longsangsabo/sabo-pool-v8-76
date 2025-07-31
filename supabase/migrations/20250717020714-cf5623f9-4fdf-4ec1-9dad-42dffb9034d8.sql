-- Function để rebuild bracket với signature hiện tại
CREATE OR REPLACE FUNCTION fix_double_elimination_bracket()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  match_rec RECORD;
  winner_id UUID;
  loser_id UUID;
  advancement_result jsonb;
  total_fixed INTEGER := 0;
BEGIN
  -- Process các winner bracket matches đã hoàn thành
  FOR match_rec IN 
    SELECT tm.id, tm.player1_id, tm.player2_id, tm.winner_id, tm.bracket_type, tm.round_number
    FROM tournament_matches tm
    WHERE tm.tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
    AND tm.status = 'completed' 
    AND tm.winner_id IS NOT NULL
    AND tm.bracket_type = 'winner'
    ORDER BY tm.round_number, tm.match_number
  LOOP
    -- Xác định winner và loser
    winner_id := match_rec.winner_id;
    loser_id := CASE 
      WHEN match_rec.winner_id = match_rec.player1_id THEN match_rec.player2_id
      ELSE match_rec.player1_id
    END;
    
    -- Gọi function advancement với loser_id
    SELECT advance_double_elimination_winner(match_rec.id, winner_id, loser_id) INTO advancement_result;
    total_fixed := total_fixed + 1;
    
    RAISE NOTICE 'Fixed winner bracket match %: % vs %, winner: %', 
      match_rec.id, match_rec.player1_id, match_rec.player2_id, winner_id;
  END LOOP;
  
  -- Process các loser bracket matches đã hoàn thành
  FOR match_rec IN 
    SELECT tm.id, tm.player1_id, tm.player2_id, tm.winner_id, tm.bracket_type, tm.round_number
    FROM tournament_matches tm
    WHERE tm.tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
    AND tm.status = 'completed' 
    AND tm.winner_id IS NOT NULL
    AND tm.bracket_type = 'loser'
    ORDER BY tm.round_number, tm.match_number
  LOOP
    -- Xác định winner và loser
    winner_id := match_rec.winner_id;
    loser_id := CASE 
      WHEN match_rec.winner_id = match_rec.player1_id THEN match_rec.player2_id
      ELSE match_rec.player1_id
    END;
    
    -- Gọi function advancement với loser_id
    SELECT advance_double_elimination_winner(match_rec.id, winner_id, loser_id) INTO advancement_result;
    total_fixed := total_fixed + 1;
    
    RAISE NOTICE 'Fixed loser bracket match %: % vs %, winner: %', 
      match_rec.id, match_rec.player1_id, match_rec.player2_id, winner_id;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'matches_processed', total_fixed,
    'message', 'Double elimination bracket fixed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'matches_processed', total_fixed
    );
END;
$$;

-- Chạy function fix
SELECT fix_double_elimination_bracket();