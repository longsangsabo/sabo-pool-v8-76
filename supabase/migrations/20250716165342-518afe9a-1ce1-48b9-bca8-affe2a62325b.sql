-- Add the rest of the double elimination bracket structure

-- Winner Bracket Round 2-4 (placeholder matches)
INSERT INTO tournament_matches (tournament_id, round_number, match_number, player1_id, player2_id, status, bracket_type, created_at, updated_at)
VALUES 
-- Round 2: 4 matches
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 2, 1, NULL, NULL, 'pending', 'winner', now(), now()),
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 2, 2, NULL, NULL, 'pending', 'winner', now(), now()),
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 2, 3, NULL, NULL, 'pending', 'winner', now(), now()),
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 2, 4, NULL, NULL, 'pending', 'winner', now(), now()),
-- Round 3: 2 matches
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 3, 1, NULL, NULL, 'pending', 'winner', now(), now()),
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 3, 2, NULL, NULL, 'pending', 'winner', now(), now()),
-- Round 4: 1 match (Winner Final)
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 4, 1, NULL, NULL, 'pending', 'winner', now(), now());

-- Loser Bracket Matches
INSERT INTO tournament_matches (tournament_id, round_number, match_number, player1_id, player2_id, status, bracket_type, created_at, updated_at)
VALUES 
-- Round 1: 4 matches (losers from WB R1)
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 1, 1, NULL, NULL, 'pending', 'loser', now(), now()),
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 1, 2, NULL, NULL, 'pending', 'loser', now(), now()),
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 1, 3, NULL, NULL, 'pending', 'loser', now(), now()),
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 1, 4, NULL, NULL, 'pending', 'loser', now(), now()),
-- Round 2: 2 matches
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 2, 1, NULL, NULL, 'pending', 'loser', now(), now()),
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 2, 2, NULL, NULL, 'pending', 'loser', now(), now()),
-- Round 3: 2 matches
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 3, 1, NULL, NULL, 'pending', 'loser', now(), now()),
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 3, 2, NULL, NULL, 'pending', 'loser', now(), now()),
-- Round 4: 1 match
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 4, 1, NULL, NULL, 'pending', 'loser', now(), now()),
-- Round 5: 1 match (Loser Final)
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 5, 1, NULL, NULL, 'pending', 'loser', now(), now());

-- Grand Final
INSERT INTO tournament_matches (tournament_id, round_number, match_number, player1_id, player2_id, status, bracket_type, created_at, updated_at)
VALUES 
('d8f6f334-7fa0-4dc3-9804-1d25379d9d07', 1, 1, NULL, NULL, 'pending', 'grand_final', now(), now());