-- Update Loser's Branch A Round 1/4 matches with the 4 winners from Round 1/8
-- Tournament ID: ec32cfdd-40e3-4cbf-9429-2f9e718a0b26

-- Get the 4 winners from LB R1 (Round 1/8) and assign them to LB R2 (Round 1/4)
-- Winners: Phan Nam Long, Đặng Linh Khoa, Vũ Nam Khoa, Trần Nam Phong

-- Update first LB R2 match: Phan Nam Long vs Đặng Linh Khoa
UPDATE tournament_matches 
SET 
  player1_id = (SELECT id FROM tournament_participants WHERE name = 'Phan Nam Long' AND tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'),
  player2_id = (SELECT id FROM tournament_participants WHERE name = 'Đặng Linh Khoa' AND tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'),
  status = 'scheduled'
WHERE tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'
  AND bracket_type = 'loser'
  AND round_number = 2
  AND match_number = 1;

-- Update second LB R2 match: Vũ Nam Khoa vs Trần Nam Phong  
UPDATE tournament_matches 
SET 
  player1_id = (SELECT id FROM tournament_participants WHERE name = 'Vũ Nam Khoa' AND tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'),
  player2_id = (SELECT id FROM tournament_participants WHERE name = 'Trần Nam Phong' AND tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'),
  status = 'scheduled'
WHERE tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'
  AND bracket_type = 'loser'
  AND round_number = 2
  AND match_number = 2;