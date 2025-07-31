-- Advance winners từ Loser Branch A vào Loser Branch B
DO $$
DECLARE
  lb4_winners UUID[];
  lb5_winners UUID[];
  lb6_winners UUID[];
  wb3_losers UUID[];
  i INTEGER;
BEGIN
  -- Lấy winners từ LB Round 4 (đã completed)
  SELECT ARRAY_AGG(winner_id ORDER BY match_number) INTO lb4_winners
  FROM tournament_matches
  WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
  AND round_number = 4
  AND bracket_type = 'loser'
  AND winner_id IS NOT NULL;
  
  -- Lấy winners từ LB Round 5 (đã completed)
  SELECT ARRAY_AGG(winner_id ORDER BY match_number) INTO lb5_winners
  FROM tournament_matches
  WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
  AND round_number = 5
  AND bracket_type = 'loser'
  AND winner_id IS NOT NULL;
  
  -- Lấy winners từ LB Round 6 (đã completed)
  SELECT ARRAY_AGG(winner_id ORDER BY match_number) INTO lb6_winners
  FROM tournament_matches
  WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
  AND round_number = 6
  AND bracket_type = 'loser'
  AND winner_id IS NOT NULL;
  
  -- Lấy losers từ WB Round 3 (semifinals)
  SELECT ARRAY_AGG(
    CASE 
      WHEN winner_id = player1_id THEN player2_id
      WHEN winner_id = player2_id THEN player1_id
      ELSE NULL
    END
    ORDER BY match_number
  ) INTO wb3_losers
  FROM tournament_matches
  WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
  AND round_number = 3
  AND bracket_type = 'winner'
  AND winner_id IS NOT NULL;

  -- Advance vào LB Round 7 (Loser Branch B)
  -- Match 1: LB4 winner 1 vs LB4 winner 2
  IF array_length(lb4_winners, 1) >= 2 THEN
    UPDATE tournament_matches
    SET player1_id = lb4_winners[1],
        player2_id = lb4_winners[2],
        status = 'scheduled'
    WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
    AND round_number = 7
    AND match_number = 1
    AND bracket_type = 'loser';
  END IF;
  
  -- Match 2: LB4 winner 3 vs LB4 winner 4  
  IF array_length(lb4_winners, 1) >= 4 THEN
    UPDATE tournament_matches
    SET player1_id = lb4_winners[3],
        player2_id = lb4_winners[4],
        status = 'scheduled'
    WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
    AND round_number = 7
    AND match_number = 2
    AND bracket_type = 'loser';
  END IF;

  -- Match 3: LB5 winner 1 vs WB3 loser 1
  IF array_length(lb5_winners, 1) >= 1 AND array_length(wb3_losers, 1) >= 1 THEN
    UPDATE tournament_matches
    SET player1_id = lb5_winners[1],
        player2_id = wb3_losers[1],
        status = 'scheduled'
    WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
    AND round_number = 7
    AND match_number = 3
    AND bracket_type = 'loser';
  END IF;

  -- Match 4: LB5 winner 2 vs WB3 loser 2
  IF array_length(lb5_winners, 1) >= 2 AND array_length(wb3_losers, 1) >= 2 THEN
    UPDATE tournament_matches
    SET player1_id = lb5_winners[2],
        player2_id = wb3_losers[2],
        status = 'scheduled'
    WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
    AND round_number = 7
    AND match_number = 4
    AND bracket_type = 'loser';
  END IF;

  RAISE NOTICE 'LB4 Winners: %', array_length(lb4_winners, 1);
  RAISE NOTICE 'LB5 Winners: %', array_length(lb5_winners, 1);  
  RAISE NOTICE 'LB6 Winners: %', array_length(lb6_winners, 1);
  RAISE NOTICE 'WB3 Losers: %', array_length(wb3_losers, 1);
END $$;