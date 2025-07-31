-- Fix Branch B to have correct Round 2 losers only
-- Clear current incorrect Branch B data
UPDATE tournament_matches 
SET 
  player1_id = NULL,
  player2_id = NULL,
  status = 'pending',
  updated_at = NOW()
WHERE tournament_id = (
  SELECT id FROM tournaments 
  WHERE name ILIKE '%double1%' 
  ORDER BY created_at DESC LIMIT 1
)
AND round_number IN (201, 202);

-- Get the tournament ID for reference
DO $$
DECLARE
  v_tournament_id UUID;
  v_loser1_id UUID := (SELECT user_id FROM profiles WHERE full_name = 'Võ Hương Cường');
  v_loser2_id UUID := (SELECT user_id FROM profiles WHERE full_name = 'Nguyễn Thị Phong');
  v_loser3_id UUID := (SELECT user_id FROM profiles WHERE full_name = 'Đặng Linh Hải');
  v_loser4_id UUID := (SELECT user_id FROM profiles WHERE full_name = 'Đặng Hùng Quân');
BEGIN
  -- Get tournament ID
  SELECT id INTO v_tournament_id FROM tournaments 
  WHERE name ILIKE '%double1%' 
  ORDER BY created_at DESC LIMIT 1;
  
  -- Populate Branch B Round 201 with correct Round 2 losers
  -- Match 1: Võ Hương Cường vs Nguyễn Thị Phong
  UPDATE tournament_matches 
  SET 
    player1_id = v_loser1_id,
    player2_id = v_loser2_id,
    status = 'scheduled',
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id
    AND round_number = 201 
    AND match_number = 1;
    
  -- Match 2: Đặng Linh Hải vs Đặng Hùng Quân  
  UPDATE tournament_matches 
  SET 
    player1_id = v_loser3_id,
    player2_id = v_loser4_id,
    status = 'scheduled',
    updated_at = NOW()
  WHERE tournament_id = v_tournament_id
    AND round_number = 201 
    AND match_number = 2;
    
END $$;