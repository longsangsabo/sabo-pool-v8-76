-- Manually create and populate loser bracket for this tournament
WITH losers AS (
  -- Get all 8 losers from Winner Round 1
  SELECT 
    tournament_id,
    match_number,
    CASE 
      WHEN player1_id = winner_id THEN player2_id 
      ELSE player1_id 
    END as loser_id,
    ROW_NUMBER() OVER (ORDER BY match_number) as loser_sequence
  FROM tournament_matches 
  WHERE tournament_id = '67e4abbe-e783-4576-b14e-1f7fe6bc6da8'
    AND bracket_type = 'winner'
    AND round_number = 1
    AND status = 'completed'
    AND winner_id IS NOT NULL
)
-- Insert Loser Bracket Round 1 matches with proper pairing
INSERT INTO tournament_matches (
  tournament_id, bracket_type, branch_type, round_number, match_number,
  player1_id, player2_id, status, created_at, updated_at
)
SELECT 
  '67e4abbe-e783-4576-b14e-1f7fe6bc6da8'::uuid,
  'loser_a',
  'branch_a',
  1,
  match_num,
  p1.loser_id,
  p2.loser_id,
  'scheduled',
  NOW(),
  NOW()
FROM (
  -- Create 4 matches from 8 losers
  VALUES 
    (1, 1, 2),  -- Match 1: Loser from Winner Match 1 vs 2
    (2, 3, 4),  -- Match 2: Loser from Winner Match 3 vs 4
    (3, 5, 6),  -- Match 3: Loser from Winner Match 5 vs 6  
    (4, 7, 8)   -- Match 4: Loser from Winner Match 7 vs 8
) AS matches(match_num, loser1_seq, loser2_seq)
JOIN losers p1 ON p1.loser_sequence = matches.loser1_seq
JOIN losers p2 ON p2.loser_sequence = matches.loser2_seq;

-- Verify the creation
SELECT 
  bracket_type,
  branch_type,
  round_number,
  match_number,
  player1_id,
  player2_id,
  status
FROM tournament_matches 
WHERE tournament_id = '67e4abbe-e783-4576-b14e-1f7fe6bc6da8'
  AND bracket_type = 'loser_a'
ORDER BY round_number, match_number;