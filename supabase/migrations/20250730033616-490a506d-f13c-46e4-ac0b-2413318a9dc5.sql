-- Manual fix for the tournament progression issue
-- Get the current tournament and fix Round 3 matches
DO $$
DECLARE
  v_tournament_id uuid;
  v_winner1 uuid;  -- Winner of Round 2 Match 1
  v_winner2 uuid;  -- Winner of Round 2 Match 2
  v_winner3 uuid;  -- Winner of Round 2 Match 3
  v_winner4 uuid;  -- Winner of Round 2 Match 4
BEGIN
  -- Get current tournament
  SELECT id INTO v_tournament_id 
  FROM tournaments 
  WHERE tournament_type = 'double_elimination' 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Get Round 2 winners
  SELECT winner_id INTO v_winner1 FROM tournament_matches 
  WHERE tournament_id = v_tournament_id AND round_number = 2 AND match_number = 1;
  
  SELECT winner_id INTO v_winner2 FROM tournament_matches 
  WHERE tournament_id = v_tournament_id AND round_number = 2 AND match_number = 2;
  
  SELECT winner_id INTO v_winner3 FROM tournament_matches 
  WHERE tournament_id = v_tournament_id AND round_number = 2 AND match_number = 3;
  
  SELECT winner_id INTO v_winner4 FROM tournament_matches 
  WHERE tournament_id = v_tournament_id AND round_number = 2 AND match_number = 4;
  
  -- Fix Round 3 (Semifinals) matches correctly
  -- Match 1: Winner of R2M1 vs Winner of R2M2
  UPDATE tournament_matches 
  SET 
    player1_id = v_winner1,
    player2_id = v_winner2,
    status = 'scheduled',
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id 
    AND round_number = 3 
    AND match_number = 1;
    
  -- Match 2: Winner of R2M3 vs Winner of R2M4  
  UPDATE tournament_matches 
  SET 
    player1_id = v_winner3,
    player2_id = v_winner4,
    status = 'scheduled',
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id 
    AND round_number = 3 
    AND match_number = 2;
    
  RAISE NOTICE 'Fixed Round 3 matches with winners: %, %, %, %', v_winner1, v_winner2, v_winner3, v_winner4;
END $$;