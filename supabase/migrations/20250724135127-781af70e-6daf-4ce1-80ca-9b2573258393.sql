-- Fix Tournament Bracket Data Directly
-- This migration fixes the corrupted tournament bracket for tournament ec32cfdd-40e3-4cbf-9429-2f9e718a0b26

-- Step 1: Clean up corrupted matches in losers bracket (matches 20-23 with duplicate players)
DELETE FROM tournament_matches 
WHERE tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'
AND bracket_type = 'loser'
AND round_number IN (2, 3)
AND match_number IN (1, 2, 3, 4);

-- Step 2: Fix Loser's Branch A - Create proper LB R2 matches from LB R1 winners
-- Get LB R1 winners: Phan Nam Long (1b20b730), Đặng Linh Khoa (4aa58392), Vũ Nam Khoa (9f5c350d), Trần Nam Phong (d7d6ce12)

-- Create LB R2 Match 1: Phan Nam Long vs Đặng Linh Khoa  
INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, created_at, updated_at
) VALUES (
    'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26', 'loser', 2, 1,
    '1b20b730-51f7-4a58-9d14-ca168a51be99', -- Phan Nam Long
    '4aa58392-9e4d-42fc-a9ef-7b031c8279db', -- Đặng Linh Khoa
    'scheduled', NOW(), NOW()
);

-- Create LB R2 Match 2: Vũ Nam Khoa vs Trần Nam Phong
INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, created_at, updated_at
) VALUES (
    'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26', 'loser', 2, 2,
    '9f5c350d-5ee2-4aa4-bd1e-e1ac2ed57e6a', -- Vũ Nam Khoa
    'd7d6ce12-490f-4fff-b913-80044de5e169', -- Trần Nam Phong
    'scheduled', NOW(), NOW()
);

-- Create LB R3 Branch A Final (winner of LB R2 Match 1 vs winner of LB R2 Match 2)
INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, created_at, updated_at
) VALUES (
    'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26', 'loser', 3, 1,
    NULL, NULL, -- Will be filled by winners from LB R2
    'scheduled', NOW(), NOW()
);

-- Step 3: Create Loser's Branch B structure
-- First, bring losers from WB R2 into LB R4
-- These are the 4 losers from Winners Bracket Round 2

-- Get the losers from WB R2 and create LB R4 matches
-- LB R4 Match 1: Loser from WB R2 Match 1 vs Loser from WB R2 Match 2
INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, created_at, updated_at
) VALUES (
    'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26', 'loser', 4, 1,
    NULL, NULL, -- Will be filled with WB R2 losers
    'scheduled', NOW(), NOW()
);

-- LB R4 Match 2: Loser from WB R2 Match 3 vs Loser from WB R2 Match 4
INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, created_at, updated_at
) VALUES (
    'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26', 'loser', 4, 2,
    NULL, NULL, -- Will be filled with WB R2 losers
    'scheduled', NOW(), NOW()
);

-- Create LB R5: Winners from LB R4 vs Winner from Branch A (LB R3)
INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, created_at, updated_at
) VALUES (
    'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26', 'loser', 5, 1,
    NULL, NULL, -- Winner from LB R4 Match 1 vs Winner from LB R3 (Branch A)
    'scheduled', NOW(), NOW()
);

INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, created_at, updated_at
) VALUES (
    'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26', 'loser', 5, 2,
    NULL, NULL, -- Winner from LB R4 Match 2 vs TBD
    'scheduled', NOW(), NOW()
);

-- Step 4: Fix Winners Bracket advancement
-- Clear any corrupted winner_id in WB R2 that don't match actual players
UPDATE tournament_matches 
SET winner_id = NULL, status = 'completed'
WHERE tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'
AND bracket_type = 'winner' 
AND round_number = 2
AND winner_id NOT IN (player1_id, player2_id);

-- Step 5: Create proper Winners Bracket R3 structure if missing
-- Ensure WB R3 has proper structure for the 2 winners from WB R2
INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, created_at, updated_at
) 
SELECT 
    'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26', 'winner', 3, 1,
    NULL, NULL, 'scheduled', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tournament_matches 
    WHERE tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'
    AND bracket_type = 'winner' 
    AND round_number = 3 
    AND match_number = 1
);

-- Step 6: Create Winners Bracket Final (R4)  
INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, created_at, updated_at
) 
SELECT 
    'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26', 'winner', 4, 1,
    NULL, NULL, 'scheduled', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tournament_matches 
    WHERE tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'
    AND bracket_type = 'winner' 
    AND round_number = 4 
    AND match_number = 1
);

-- Step 7: Create Grand Final
INSERT INTO tournament_matches (
    tournament_id, bracket_type, round_number, match_number,
    player1_id, player2_id, status, created_at, updated_at
) 
SELECT 
    'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26', 'final', 5, 1,
    NULL, NULL, 'scheduled', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tournament_matches 
    WHERE tournament_id = 'ec32cfdd-40e3-4cbf-9429-2f9e718a0b26'
    AND bracket_type = 'final'
    AND round_number = 5 
    AND match_number = 1
);