-- Fix duplicate players using actual player IDs and run advancement function to verify
-- First, get the tournament ID
DO $$
DECLARE
  v_tournament_id UUID;
  v_result JSONB;
BEGIN
  -- Get tournament ID
  SELECT id INTO v_tournament_id 
  FROM tournaments 
  WHERE name ILIKE '%double6%' 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Fix duplicates using actual existing user IDs
  -- R102 M2: Reset and let advancement function handle it
  UPDATE tournament_matches 
  SET player1_id = NULL,
      player2_id = NULL,
      updated_at = NOW()
  WHERE tournament_id = v_tournament_id
    AND round_number = 102 
    AND match_number = 2;
  
  -- R103 M1: Reset completely
  UPDATE tournament_matches 
  SET player1_id = NULL,
      player2_id = NULL,
      updated_at = NOW()
  WHERE tournament_id = v_tournament_id
    AND round_number = 103 
    AND match_number = 1;
  
  -- R202 M1: Reset and let advancement function handle it
  UPDATE tournament_matches 
  SET player1_id = NULL,
      player2_id = NULL,
      updated_at = NOW()
  WHERE tournament_id = v_tournament_id
    AND round_number = 202 
    AND match_number = 1;
  
  -- Run advancement function to properly assign players
  SELECT advance_sabo_tournament_fixed(
    v_tournament_id,
    NULL,
    NULL
  ) INTO v_result;
  
  RAISE NOTICE 'Fixed duplicates and ran advancement. Result: %', v_result;
END $$;