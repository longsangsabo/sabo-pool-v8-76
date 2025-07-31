-- Update loser bracket Round 1 matches with players who lost in winner bracket Round 1
-- This will automatically pair up the losers from winner bracket to loser bracket

-- First, get the losers from winner bracket round 1 and assign them to loser bracket round 1
WITH winner_round1_losers AS (
  SELECT 
    CASE WHEN winner_id = player1_id THEN player2_id ELSE player1_id END as loser_id,
    match_number,
    ROW_NUMBER() OVER (ORDER BY match_number) as loser_order
  FROM tournament_matches 
  WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
  AND bracket_type = 'winner' 
  AND round_number = 1 
  AND status = 'completed'
  AND winner_id IS NOT NULL
),
loser_bracket_matches AS (
  SELECT 
    id,
    match_number,
    ROW_NUMBER() OVER (ORDER BY match_number) as match_order
  FROM tournament_matches 
  WHERE tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
  AND bracket_type = 'loser' 
  AND round_number = 1
  ORDER BY match_number
)
UPDATE tournament_matches 
SET 
  player1_id = CASE 
    WHEN lb.match_order % 2 = 1 THEN 
      (SELECT loser_id FROM winner_round1_losers WHERE loser_order = (lb.match_order * 2 - 1))
    ELSE 
      (SELECT loser_id FROM winner_round1_losers WHERE loser_order = (lb.match_order * 2 - 1))
  END,
  player2_id = CASE 
    WHEN lb.match_order % 2 = 1 THEN 
      (SELECT loser_id FROM winner_round1_losers WHERE loser_order = (lb.match_order * 2))
    ELSE 
      (SELECT loser_id FROM winner_round1_losers WHERE loser_order = (lb.match_order * 2))
  END,
  status = 'scheduled',
  updated_at = NOW()
FROM loser_bracket_matches lb
WHERE tournament_matches.id = lb.id
AND tournament_matches.tournament_id = 'd8f6f334-7fa0-4dc3-9804-1d25379d9d07'
AND tournament_matches.bracket_type = 'loser' 
AND tournament_matches.round_number = 1;