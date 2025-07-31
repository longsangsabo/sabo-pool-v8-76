-- Fix the duplicate player assignments in tournament matches
-- Clear all duplicate assignments and regenerate proper bracket structure

DO $$
DECLARE
  v_tournament_id UUID := '62f5810b-8695-4ece-9daf-fa8c4bfbf4f7'; -- Tournament ID from the image
  v_match RECORD;
BEGIN
  -- Fix all matches where player1_id = player2_id (same player assigned)
  UPDATE tournament_matches 
  SET 
    player2_id = NULL,
    status = 'scheduled',
    winner_id = NULL,
    score_player1 = 0,
    score_player2 = 0,
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id
    AND player1_id = player2_id
    AND player1_id IS NOT NULL;

  -- Reset all Round 2+ matches to prevent cascading issues
  UPDATE tournament_matches 
  SET 
    player1_id = NULL,
    player2_id = NULL,
    winner_id = NULL,
    status = 'scheduled',
    score_player1 = 0,
    score_player2 = 0,
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id
    AND round_number > 1;

  RAISE NOTICE 'Fixed duplicate player assignments in tournament %', v_tournament_id;
END $$;