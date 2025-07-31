-- Fix double elimination bracket progression for Tournament ID: 62f5810b-8695-4ece-9daf-fa8c4bfbf4f7
-- Run repair function to advance winners to Round 2 and losers to Branch A

DO $$
DECLARE
  v_tournament_id UUID := '62f5810b-8695-4ece-9daf-fa8c4bfbf4f7';
  v_repair_result JSONB;
BEGIN
  -- First, ensure all Round 1 matches have proper completion status
  UPDATE tournament_matches 
  SET status = 'completed', updated_at = NOW()
  WHERE tournament_id = v_tournament_id
    AND round_number = 1
    AND winner_id IS NOT NULL
    AND status != 'completed';

  -- Run the repair function to fix advancement
  SELECT repair_double_elimination_v9(v_tournament_id) INTO v_repair_result;
  
  RAISE NOTICE 'Repair result: %', v_repair_result;
  
  -- Manual advancement for Round 1 completed matches if repair didn't work
  -- Advance winners to Winner's Round 2
  
  -- Round 2 Match 1: Winner of R1M1 vs Winner of R1M2
  UPDATE tournament_matches 
  SET 
    player1_id = (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 1),
    player2_id = (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 2),
    status = CASE WHEN (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 1) IS NOT NULL 
                    AND (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 2) IS NOT NULL 
                  THEN 'ready' ELSE 'scheduled' END,
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id 
    AND round_number = 2 
    AND match_number = 1
    AND bracket_type = 'winners';

  -- Round 2 Match 2: Winner of R1M3 vs Winner of R1M4
  UPDATE tournament_matches 
  SET 
    player1_id = (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 3),
    player2_id = (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 4),
    status = CASE WHEN (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 3) IS NOT NULL 
                    AND (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 4) IS NOT NULL 
                  THEN 'ready' ELSE 'scheduled' END,
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id 
    AND round_number = 2 
    AND match_number = 2
    AND bracket_type = 'winners';

  -- Round 2 Match 3: Winner of R1M5 vs Winner of R1M6  
  UPDATE tournament_matches 
  SET 
    player1_id = (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 5),
    player2_id = (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 6),
    status = CASE WHEN (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 5) IS NOT NULL 
                    AND (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 6) IS NOT NULL 
                  THEN 'ready' ELSE 'scheduled' END,
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id 
    AND round_number = 2 
    AND match_number = 3
    AND bracket_type = 'winners';

  -- Round 2 Match 4: Winner of R1M7 vs Winner of R1M8
  UPDATE tournament_matches 
  SET 
    player1_id = (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 7),
    player2_id = (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 8),
    status = CASE WHEN (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 7) IS NOT NULL 
                    AND (SELECT winner_id FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 8) IS NOT NULL 
                  THEN 'ready' ELSE 'scheduled' END,
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id 
    AND round_number = 2 
    AND match_number = 4
    AND bracket_type = 'winners';

  -- Advance losers to Loser's Branch A
  -- Loser's Branch A gets losers from Winner's Round 1
  
  -- Branch A Match 1: Loser R1M1 vs Loser R1M2
  UPDATE tournament_matches 
  SET 
    player1_id = (SELECT CASE WHEN player1_id != winner_id THEN player1_id ELSE player2_id END 
                  FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 1),
    player2_id = (SELECT CASE WHEN player1_id != winner_id THEN player1_id ELSE player2_id END 
                  FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 2),
    status = 'ready',
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id 
    AND bracket_type = 'branch_a' 
    AND round_number = 101
    AND match_number = 1;

  -- Branch A Match 2: Loser R1M3 vs Loser R1M4
  UPDATE tournament_matches 
  SET 
    player1_id = (SELECT CASE WHEN player1_id != winner_id THEN player1_id ELSE player2_id END 
                  FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 3),
    player2_id = (SELECT CASE WHEN player1_id != winner_id THEN player1_id ELSE player2_id END 
                  FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 4),
    status = 'ready',
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id 
    AND bracket_type = 'branch_a' 
    AND round_number = 101
    AND match_number = 2;

  -- Branch A Match 3: Loser R1M5 vs Loser R1M6
  UPDATE tournament_matches 
  SET 
    player1_id = (SELECT CASE WHEN player1_id != winner_id THEN player1_id ELSE player2_id END 
                  FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 5),
    player2_id = (SELECT CASE WHEN player1_id != winner_id THEN player1_id ELSE player2_id END 
                  FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 6),
    status = 'ready',
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id 
    AND bracket_type = 'branch_a' 
    AND round_number = 101
    AND match_number = 3;

  -- Branch A Match 4: Loser R1M7 vs Loser R1M8
  UPDATE tournament_matches 
  SET 
    player1_id = (SELECT CASE WHEN player1_id != winner_id THEN player1_id ELSE player2_id END 
                  FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 7),
    player2_id = (SELECT CASE WHEN player1_id != winner_id THEN player1_id ELSE player2_id END 
                  FROM tournament_matches WHERE tournament_id = v_tournament_id AND round_number = 1 AND match_number = 8),
    status = 'ready',
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id 
    AND bracket_type = 'branch_a' 
    AND round_number = 101
    AND match_number = 4;

  RAISE NOTICE 'Successfully advanced winners to Round 2 and losers to Branch A for tournament %', v_tournament_id;
END $$;