-- Fix SEMIFINALS population for double1 tournament
-- Semifinals should be:
-- Match 1: Phan Lan Cường (WB Winner 1) vs Trần Nam Phong (LA Champion)  
-- Match 2: Anh Long (WB Winner 2) vs Võ Hương Cường (LB Champion)

DO $$
DECLARE
  tournament_id_var uuid := '36f6dd14-2f12-469d-be24-1649bdca034b';
  wb_winner1 uuid; -- Phan Lan Cường
  wb_winner2 uuid; -- Anh Long
  la_champion uuid; -- Trần Nam Phong
  lb_champion uuid; -- Võ Hương Cường
BEGIN
  -- Get Winners Bracket Round 3 winners
  SELECT winner_id INTO wb_winner1
  FROM tournament_matches 
  WHERE tournament_id = tournament_id_var 
    AND round_number = 3 
    AND match_number = 1 
    AND status = 'completed';
    
  SELECT winner_id INTO wb_winner2
  FROM tournament_matches 
  WHERE tournament_id = tournament_id_var 
    AND round_number = 3 
    AND match_number = 2 
    AND status = 'completed';
  
  -- Get Losers Branch A Champion (Round 103)
  SELECT winner_id INTO la_champion
  FROM tournament_matches 
  WHERE tournament_id = tournament_id_var 
    AND round_number = 103 
    AND status = 'completed';
    
  -- Get Losers Branch B Champion (Round 202)
  SELECT winner_id INTO lb_champion
  FROM tournament_matches 
  WHERE tournament_id = tournament_id_var 
    AND round_number = 202 
    AND status = 'completed';
  
  -- Clear any existing semifinals first
  UPDATE tournament_matches 
  SET player1_id = NULL, player2_id = NULL, status = 'pending', winner_id = NULL
  WHERE tournament_id = tournament_id_var 
    AND round_number = 250;
  
  -- Populate Semifinal 1: WB Winner 1 vs LA Champion
  IF wb_winner1 IS NOT NULL AND la_champion IS NOT NULL THEN
    UPDATE tournament_matches 
    SET 
      player1_id = wb_winner1,
      player2_id = la_champion,
      status = 'scheduled',
      updated_at = NOW()
    WHERE tournament_id = tournament_id_var 
      AND round_number = 250 
      AND match_number = 1;
  END IF;
  
  -- Populate Semifinal 2: WB Winner 2 vs LB Champion  
  IF wb_winner2 IS NOT NULL AND lb_champion IS NOT NULL THEN
    UPDATE tournament_matches 
    SET 
      player1_id = wb_winner2,
      player2_id = lb_champion,
      status = 'scheduled',
      updated_at = NOW()
    WHERE tournament_id = tournament_id_var 
      AND round_number = 250 
      AND match_number = 2;
  END IF;
  
  RAISE NOTICE 'Semifinals populated: WB1=%, WB2=%, LA=%, LB=%', wb_winner1, wb_winner2, la_champion, lb_champion;
END $$;