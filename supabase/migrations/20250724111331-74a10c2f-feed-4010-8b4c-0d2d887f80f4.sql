-- Fix bracket_type for double elimination tournament matches
-- For 16-player double elimination with 15 matches:
-- Round 1: Winners bracket (8 matches)
-- Round 2: Winners bracket (4 matches) 
-- Round 3: Winners bracket (2 matches)
-- Round 4: Final (1 match)

-- Set bracket_type for Round 1 (Winners bracket)
UPDATE tournament_matches 
SET bracket_type = 'winners'
WHERE tournament_id = '2651c29c-2388-4687-8034-f8659491a409'
  AND round_number = 1;

-- Set bracket_type for Round 2 (Winners bracket)  
UPDATE tournament_matches 
SET bracket_type = 'winners'
WHERE tournament_id = '2651c29c-2388-4687-8034-f8659491a409'
  AND round_number = 2;

-- Set bracket_type for Round 3 (Winners bracket semifinal)
UPDATE tournament_matches 
SET bracket_type = 'winners'
WHERE tournament_id = '2651c29c-2388-4687-8034-f8659491a409'
  AND round_number = 3;

-- Set bracket_type for Round 4 (Final)
UPDATE tournament_matches 
SET bracket_type = 'final'
WHERE tournament_id = '2651c29c-2388-4687-8034-f8659491a409'
  AND round_number = 4;