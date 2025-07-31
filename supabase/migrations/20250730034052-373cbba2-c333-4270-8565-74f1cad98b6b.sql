-- CRITICAL FIX: Reset and correct Losers Branch A Round 102 advancement
-- Step 1: Reset Round 102 matches to clean state
UPDATE tournament_matches 
SET 
  player1_id = NULL,
  player2_id = NULL,
  status = 'pending',
  score_player1 = NULL,
  score_player2 = NULL,
  winner_id = NULL,
  updated_at = NOW()
WHERE tournament_id = (
  SELECT id FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
  ORDER BY created_at DESC LIMIT 1
)
AND round_number = 102;

-- Step 2: Correctly populate Round 102 with proper SABO logic
-- Round 102 should have Round 101 winners vs Round 2 losers
DO $$
DECLARE
  v_tournament_id uuid;
  v_round101_winners uuid[];
  v_round2_losers uuid[];
BEGIN
  -- Get current tournament
  SELECT id INTO v_tournament_id 
  FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
  ORDER BY created_at DESC LIMIT 1;
  
  -- Get Round 101 winners (in order)
  SELECT array_agg(winner_id ORDER BY match_number) INTO v_round101_winners
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
    AND round_number = 101 
    AND status = 'completed' 
    AND winner_id IS NOT NULL;
  
  -- Get Round 2 losers (in order)
  SELECT array_agg(
    CASE WHEN player1_id = winner_id THEN player2_id ELSE player1_id END 
    ORDER BY match_number
  ) INTO v_round2_losers
  FROM tournament_matches 
  WHERE tournament_id = v_tournament_id 
    AND round_number = 2 
    AND status = 'completed' 
    AND winner_id IS NOT NULL;
  
  -- Populate Round 102 Match 1: Round 101 Winner 1 vs Round 2 Loser 1
  UPDATE tournament_matches 
  SET 
    player1_id = v_round101_winners[1],
    player2_id = v_round2_losers[1],
    status = 'scheduled',
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id 
    AND round_number = 102 
    AND match_number = 1;
    
  -- Populate Round 102 Match 2: Round 101 Winner 2 vs Round 2 Loser 2  
  UPDATE tournament_matches 
  SET 
    player1_id = v_round101_winners[2],
    player2_id = v_round2_losers[2],
    status = 'scheduled',
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id 
    AND round_number = 102 
    AND match_number = 2;
    
  RAISE NOTICE 'Fixed Round 102: R101 winners % vs R2 losers %', v_round101_winners, v_round2_losers;
END $$;