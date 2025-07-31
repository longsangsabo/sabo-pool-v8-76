-- Update Loser's Branch A Round 1/4 (Round 2) matches with the 4 winners from Round 1/8 (Round 1)
-- Tournament ID: ec32cfdd-40e3-4cbf-9429-2f9e718a0b26

-- Update first loser bracket R2 match: Winner from match 16 vs Winner from match 17
UPDATE tournament_matches 
SET 
  player1_id = '519cf7c9-e112-40b2-9e4d-0cd44783ec9e',  -- Winner from match 16
  player2_id = '46bfe678-66cf-48a9-8bc8-d2eee8274ac3',  -- Winner from match 17
  status = 'scheduled'
WHERE tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'
  AND bracket_type = 'loser'
  AND round_number = 2
  AND match_number = 1;

-- Update second loser bracket R2 match: Winner from match 18 vs Winner from match 19  
UPDATE tournament_matches 
SET 
  player1_id = 'f271ced4-12e2-4643-8123-1a65df65acf8',  -- Winner from match 18
  player2_id = 'aa25684c-90e5-4c5c-aa23-83b65d398b62',  -- Winner from match 19
  status = 'scheduled'
WHERE tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'
  AND bracket_type = 'loser'
  AND round_number = 2
  AND match_number = 2;