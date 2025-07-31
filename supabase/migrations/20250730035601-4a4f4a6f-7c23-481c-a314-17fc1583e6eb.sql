-- Fix Branch A Round 102 to have only Round 101 winners
DO $$
DECLARE
  v_tournament_id UUID;
  v_winner1_id UUID := (SELECT user_id FROM profiles WHERE full_name = 'Võ Lan Khoa');
  v_winner2_id UUID := (SELECT user_id FROM profiles WHERE full_name = 'Vũ Nam Khoa');
  v_winner3_id UUID := (SELECT user_id FROM profiles WHERE full_name = 'Trần Nam Phong');
  v_winner4_id UUID := (SELECT user_id FROM profiles WHERE full_name = 'Vũ Văn Cường');
BEGIN
  -- Get tournament ID
  SELECT id INTO v_tournament_id FROM tournaments 
  WHERE name ILIKE '%double1%' 
  ORDER BY created_at DESC LIMIT 1;
  
  -- Fix Branch A Round 102 Match 1: Võ Lan Khoa vs Vũ Nam Khoa (winners from Round 101)
  UPDATE tournament_matches 
  SET 
    player1_id = v_winner1_id,
    player2_id = v_winner2_id,
    status = 'scheduled',
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id
    AND round_number = 102 
    AND match_number = 1;
    
  -- Fix Branch A Round 102 Match 2: Trần Nam Phong vs Vũ Văn Cường (winners from Round 101)
  UPDATE tournament_matches 
  SET 
    player1_id = v_winner3_id,
    player2_id = v_winner4_id,
    status = 'scheduled',
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id
    AND round_number = 102 
    AND match_number = 2;
    
END $$;