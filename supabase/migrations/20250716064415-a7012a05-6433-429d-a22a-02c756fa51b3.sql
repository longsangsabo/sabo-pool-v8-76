-- Manually complete tournament sabo1 and populate results
WITH tournament_standings AS (
  SELECT 
    tr.user_id,
    tr.tournament_id,
    COALESCE(tm_wins.wins, 0) as wins,
    COALESCE(tm_losses.losses, 0) as losses,
    COALESCE(tm_wins.wins, 0) + COALESCE(tm_losses.losses, 0) as total_matches,
    CASE 
      WHEN COALESCE(tm_wins.wins, 0) + COALESCE(tm_losses.losses, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(tm_wins.wins, 0)::numeric / (COALESCE(tm_wins.wins, 0) + COALESCE(tm_losses.losses, 0))) * 100, 2)
    END as win_percentage,
    -- Calculate total score (wins = 2 points, losses = 0 points)
    COALESCE(tm_wins.wins, 0) * 2 as total_score
  FROM tournament_registrations tr
  LEFT JOIN (
    SELECT winner_id as user_id, COUNT(*) as wins
    FROM tournament_matches 
    WHERE tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa' 
    AND status = 'completed' 
    AND winner_id IS NOT NULL
    GROUP BY winner_id
  ) tm_wins ON tr.user_id = tm_wins.user_id
  LEFT JOIN (
    SELECT 
      CASE 
        WHEN player1_id = winner_id THEN player2_id
        WHEN player2_id = winner_id THEN player1_id
      END as user_id,
      COUNT(*) as losses
    FROM tournament_matches 
    WHERE tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa' 
    AND status = 'completed' 
    AND winner_id IS NOT NULL
    GROUP BY 
      CASE 
        WHEN player1_id = winner_id THEN player2_id
        WHEN player2_id = winner_id THEN player1_id
      END
  ) tm_losses ON tr.user_id = tm_losses.user_id
  WHERE tr.tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa' 
  AND tr.status = 'confirmed'
),
ranked_standings AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (
      ORDER BY total_score DESC, win_percentage DESC, wins DESC, total_matches DESC
    ) as final_position
  FROM tournament_standings
)
-- Insert results into tournament_results table
INSERT INTO tournament_results (
  tournament_id,
  user_id,
  final_position,
  total_matches,
  wins,
  losses,
  win_percentage,
  total_score,
  prize_amount,
  spa_points_awarded,
  elo_points_awarded,
  created_at
)
SELECT 
  tournament_id,
  user_id,
  final_position,
  total_matches,
  wins,
  losses,
  win_percentage,
  total_score,
  -- Prize distribution: 1st = 500k, 2nd = 300k, 3rd = 200k
  CASE final_position
    WHEN 1 THEN 500000
    WHEN 2 THEN 300000  
    WHEN 3 THEN 200000
    ELSE 0
  END as prize_amount,
  -- SPA points: 1st = 100, 2nd = 80, 3rd = 60, others = 20
  CASE final_position
    WHEN 1 THEN 100
    WHEN 2 THEN 80
    WHEN 3 THEN 60
    ELSE 20
  END as spa_points_awarded,
  -- ELO points: 1st = +50, 2nd = +30, 3rd = +20, others = +10
  CASE final_position
    WHEN 1 THEN 50
    WHEN 2 THEN 30
    WHEN 3 THEN 20
    ELSE 10
  END as elo_points_awarded,
  NOW()
FROM ranked_standings;

-- Update tournament completed_at
UPDATE tournaments 
SET completed_at = NOW()
WHERE id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa';