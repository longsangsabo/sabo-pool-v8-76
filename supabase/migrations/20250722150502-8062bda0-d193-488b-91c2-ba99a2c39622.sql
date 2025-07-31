-- Create the missing rounds manually for test6 tournament and fix the constraint issue
-- First create tournament_brackets entry
INSERT INTO tournament_brackets (tournament_id, bracket_data, total_rounds, created_at, updated_at)
VALUES ('059309d0-67aa-4f82-884e-92bb24c57d3b', '{"type": "single_elimination"}', 4, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Create Round 2 matches (4 matches for 8 winners)
INSERT INTO tournament_matches (
  tournament_id, round_number, match_number, bracket_type,
  player1_id, player2_id, status, created_at, updated_at
) VALUES
('059309d0-67aa-4f82-884e-92bb24c57d3b', 2, 1, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),
('059309d0-67aa-4f82-884e-92bb24c57d3b', 2, 2, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),
('059309d0-67aa-4f82-884e-92bb24c57d3b', 2, 3, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),
('059309d0-67aa-4f82-884e-92bb24c57d3b', 2, 4, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW());

-- Create Round 3 matches (2 matches - semifinals)  
INSERT INTO tournament_matches (
  tournament_id, round_number, match_number, bracket_type,
  player1_id, player2_id, status, created_at, updated_at
) VALUES
('059309d0-67aa-4f82-884e-92bb24c57d3b', 3, 1, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),
('059309d0-67aa-4f82-884e-92bb24c57d3b', 3, 2, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW());

-- Create Round 4 match (final)
INSERT INTO tournament_matches (
  tournament_id, round_number, match_number, bracket_type,
  player1_id, player2_id, status, created_at, updated_at
) VALUES
('059309d0-67aa-4f82-884e-92bb24c57d3b', 4, 1, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW());

-- Now advance all the winners from Round 1
-- Match 1 winner (519cf7c9-e112-40b2-9e4d-0cd44783ec9e) goes to Round 2, Match 1, Player 1
-- Match 2 winner (0e541971-640e-4a5e-881b-b7f98a2904f7) goes to Round 2, Match 1, Player 2
UPDATE tournament_matches 
SET player1_id = '519cf7c9-e112-40b2-9e4d-0cd44783ec9e',
    player2_id = '0e541971-640e-4a5e-881b-b7f98a2904f7',
    status = 'scheduled',
    updated_at = NOW()
WHERE tournament_id = '059309d0-67aa-4f82-884e-92bb24c57d3b' AND round_number = 2 AND match_number = 1;

-- Match 3 winner (c227cca4-9687-4964-8d4a-051198545b29) goes to Round 2, Match 2, Player 1  
-- Match 4 winner (50bb862c-606c-421e-8adf-4c6f4dc38997) goes to Round 2, Match 2, Player 2
UPDATE tournament_matches 
SET player1_id = 'c227cca4-9687-4964-8d4a-051198545b29',
    player2_id = '50bb862c-606c-421e-8adf-4c6f4dc38997',
    status = 'scheduled',
    updated_at = NOW()
WHERE tournament_id = '059309d0-67aa-4f82-884e-92bb24c57d3b' AND round_number = 2 AND match_number = 2;

-- Match 5 winner (630730f6-6a4c-4e91-aab3-ce9bdc92057b) goes to Round 2, Match 3, Player 1
-- Match 6 winner (46bfe678-66cf-48a9-8bc8-d2eee8274ac3) goes to Round 2, Match 3, Player 2  
UPDATE tournament_matches 
SET player1_id = '630730f6-6a4c-4e91-aab3-ce9bdc92057b',
    player2_id = '46bfe678-66cf-48a9-8bc8-d2eee8274ac3',
    status = 'scheduled',
    updated_at = NOW()
WHERE tournament_id = '059309d0-67aa-4f82-884e-92bb24c57d3b' AND round_number = 2 AND match_number = 3;

-- Match 7 winner (3b4b5cf4-ce15-4036-9308-b21b076525b7) goes to Round 2, Match 4, Player 1
-- Match 8 winner (c00c6652-616f-4f4e-b764-8d8822d16f27) goes to Round 2, Match 4, Player 2
UPDATE tournament_matches 
SET player1_id = '3b4b5cf4-ce15-4036-9308-b21b076525b7',
    player2_id = 'c00c6652-616f-4f4e-b764-8d8822d16f27',
    status = 'scheduled',  
    updated_at = NOW()
WHERE tournament_id = '059309d0-67aa-4f82-884e-92bb24c57d3b' AND round_number = 2 AND match_number = 4;