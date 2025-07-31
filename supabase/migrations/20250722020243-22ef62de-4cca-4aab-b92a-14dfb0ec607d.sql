-- Fix Single Elimination Bracket for 16 players tournament test5
-- First, get the paid participants
WITH paid_participants AS (
  SELECT user_id 
  FROM tournament_registrations 
  WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b' 
  AND payment_status = 'paid'
  ORDER BY created_at
),
participant_array AS (
  SELECT ARRAY(SELECT user_id FROM paid_participants) as players
)
-- Delete all existing matches for this tournament
DELETE FROM tournament_matches WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b';

-- Create proper Single Elimination bracket for 16 players
-- Round 1: 8 matches (16 → 8)
INSERT INTO tournament_matches (
  tournament_id, round_number, match_number, bracket_type,
  player1_id, player2_id, status, created_at, updated_at
)
WITH paid_participants AS (
  SELECT user_id, ROW_NUMBER() OVER (ORDER BY created_at) as seeding
  FROM tournament_registrations 
  WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b' 
  AND payment_status = 'paid'
)
SELECT 
  'e9c37e3b-a598-4b71-b6a6-6362c678441b'::uuid,
  1, -- round_number
  ((p1.seeding + 1) / 2)::integer, -- match_number (1,2,3,4,5,6,7,8)
  'single_elimination',
  p1.user_id, -- player1_id
  p2.user_id, -- player2_id
  'scheduled',
  NOW(),
  NOW()
FROM paid_participants p1
JOIN paid_participants p2 ON p2.seeding = p1.seeding + 1
WHERE p1.seeding % 2 = 1; -- Only odd seeding numbers (1,3,5,7,9,11,13,15)

-- Round 2: 4 matches (8 → 4) - Quarterfinals  
INSERT INTO tournament_matches (
  tournament_id, round_number, match_number, bracket_type,
  player1_id, player2_id, status, created_at, updated_at
) VALUES
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 2, 1, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 2, 2, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 2, 3, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 2, 4, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW());

-- Round 3: 2 matches (4 → 2) - Semifinals
INSERT INTO tournament_matches (
  tournament_id, round_number, match_number, bracket_type,
  player1_id, player2_id, status, created_at, updated_at
) VALUES
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 3, 1, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW()),
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 3, 2, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW());

-- Round 4: 1 match (2 → 1) - Final
INSERT INTO tournament_matches (
  tournament_id, round_number, match_number, bracket_type,
  player1_id, player2_id, status, created_at, updated_at
) VALUES
('e9c37e3b-a598-4b71-b6a6-6362c678441b', 4, 1, 'single_elimination', NULL, NULL, 'pending', NOW(), NOW());