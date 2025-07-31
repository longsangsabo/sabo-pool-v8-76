-- Create Semifinal matches (4→2) before Grand Final
-- Semifinal Round 250: 2 WB winners + 2 LB winners → 2 finalists

-- Insert Semifinal Match 1: WB Winner 1 vs LB Winner 1 (LBA finalist)
INSERT INTO tournament_matches (
  tournament_id, round_number, match_number, bracket_type, match_stage,
  player1_id, player2_id, status, created_at, updated_at
) VALUES (
  '42a94292-c20e-4c58-b923-7748f138c49f', 250, 1, 'semifinal', 'semifinal',
  'd7d6ce12-490f-4fff-b913-80044de5e169', -- Anh Long (WB R3 M1 winner)
  '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2', -- Phan Thị Bình (LBA finalist)
  'scheduled', NOW(), NOW()
);

-- Insert Semifinal Match 2: WB Winner 2 vs LB Winner 2 (LBB finalist)  
INSERT INTO tournament_matches (
  tournament_id, round_number, match_number, bracket_type, match_stage,
  player1_id, player2_id, status, created_at, updated_at
) VALUES (
  '42a94292-c20e-4c58-b923-7748f138c49f', 250, 2, 'semifinal', 'semifinal',
  '519cf7c9-e112-40b2-9e4d-0cd44783ec9e', -- Phan Nam Long (WB R3 M2 winner)
  'c00c6652-616f-4f4e-b764-8d8822d16f27', -- Vũ Văn Cường (LBB finalist)
  'scheduled', NOW(), NOW()
);

-- Update Grand Final to receive semifinal winners (keep as pending until semifinals complete)
UPDATE tournament_matches 
SET match_stage = 'grand_final',
    status = 'pending'
WHERE tournament_id = '42a94292-c20e-4c58-b923-7748f138c49f'
  AND round_number = 301
  AND match_number = 1;