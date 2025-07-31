-- Fix GRAND FINAL population for double1 tournament
-- Grand Final should be: Trần Nam Phong vs Anh Long

DO $$
DECLARE
  tournament_id_var uuid := '36f6dd14-2f12-469d-be24-1649bdca034b';
  semifinal1_winner uuid; -- Trần Nam Phong
  semifinal2_winner uuid; -- Anh Long
BEGIN
  -- Get Semifinal 1 winner
  SELECT winner_id INTO semifinal1_winner
  FROM tournament_matches 
  WHERE tournament_id = tournament_id_var 
    AND round_number = 250 
    AND match_number = 1 
    AND status = 'completed';
    
  -- Get Semifinal 2 winner
  SELECT winner_id INTO semifinal2_winner
  FROM tournament_matches 
  WHERE tournament_id = tournament_id_var 
    AND round_number = 250 
    AND match_number = 2 
    AND status = 'completed';
  
  -- Clear any existing Grand Final first
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, status = 'pending', winner_id = NULL
  WHERE tournament_id = tournament_id_var 
    AND round_number = 300;
  
  -- Populate Grand Final
  IF semifinal1_winner IS NOT NULL AND semifinal2_winner IS NOT NULL THEN
    UPDATE tournament_matches 
    SET 
      player1_id = semifinal1_winner,
      player2_id = semifinal2_winner,
      status = 'scheduled',
      updated_at = NOW()
    WHERE tournament_id = tournament_id_var 
      AND round_number = 300 
      AND match_number = 1;
      
    RAISE NOTICE 'Grand Final populated: Player1=%, Player2=%', semifinal1_winner, semifinal2_winner;
  ELSE
    RAISE WARNING 'Cannot populate Grand Final - missing semifinal winners: SF1=%, SF2=%', semifinal1_winner, semifinal2_winner;
  END IF;
END $$;