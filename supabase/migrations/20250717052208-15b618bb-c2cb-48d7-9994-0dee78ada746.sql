-- Populate loser bracket với các thua cuộc từ winner bracket
-- Round 4 (LB Round 1): 8 thua cuộc từ WB Round 1 đấu với nhau
DO $$
DECLARE
  wb_r1_losers UUID[];
  wb_r2_losers UUID[];
  wb_r3_losers UUID[];
  i INTEGER;
BEGIN
  -- Lấy danh sách thua cuộc từ Winner Bracket Round 1
  SELECT ARRAY_AGG(
    CASE 
      WHEN winner_id = player1_id THEN player2_id
      WHEN winner_id = player2_id THEN player1_id
      ELSE NULL
    END
    ORDER BY match_number
  ) INTO wb_r1_losers
  FROM tournament_matches
  WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
  AND round_number = 1
  AND bracket_type = 'winner'
  AND winner_id IS NOT NULL;
  
  -- Lấy danh sách thua cuộc từ Winner Bracket Round 2  
  SELECT ARRAY_AGG(
    CASE 
      WHEN winner_id = player1_id THEN player2_id
      WHEN winner_id = player2_id THEN player1_id
      ELSE NULL
    END
    ORDER BY match_number
  ) INTO wb_r2_losers
  FROM tournament_matches
  WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
  AND round_number = 2
  AND bracket_type = 'winner'
  AND winner_id IS NOT NULL;

  -- Populate LB Round 1 (Round 4): 8 thua cuộc WB R1 đấu với nhau (4 matches)
  IF array_length(wb_r1_losers, 1) >= 8 THEN
    FOR i IN 1..4 LOOP
      UPDATE tournament_matches
      SET player1_id = wb_r1_losers[i*2-1],
          player2_id = wb_r1_losers[i*2],
          status = 'scheduled'
      WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
      AND round_number = 4
      AND match_number = i
      AND bracket_type = 'loser';
    END LOOP;
  END IF;

  -- Populate LB Round 2 (Round 5): 4 thua cuộc WB R2 vs 4 thắng cuộc LB R1
  -- Chỉ đặt thua cuộc WB R2 trước, thắng cuộc LB R1 sẽ được populate sau khi LB R1 hoàn thành
  IF array_length(wb_r2_losers, 1) >= 4 THEN
    FOR i IN 1..2 LOOP
      UPDATE tournament_matches
      SET player1_id = wb_r2_losers[i*2-1],
          player2_id = wb_r2_losers[i*2],
          status = 'pending'
      WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
      AND round_number = 5
      AND match_number = i
      AND bracket_type = 'loser';
    END LOOP;
  END IF;

  RAISE NOTICE 'WB R1 Losers: %', array_length(wb_r1_losers, 1);
  RAISE NOTICE 'WB R2 Losers: %', array_length(wb_r2_losers, 1);
END $$;