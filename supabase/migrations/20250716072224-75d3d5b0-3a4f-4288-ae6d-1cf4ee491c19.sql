-- Fix tournament sabo1 results with correct ELO and SPA calculations
-- First, delete the incorrect results
DELETE FROM tournament_results WHERE tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa';

-- Get correct tournament standings and results
WITH tournament_standings AS (
  SELECT 
    tr.user_id,
    tr.tournament_id,
    p.full_name,
    pr.verified_rank,
    COALESCE(tm_wins.wins, 0) as wins,
    COALESCE(tm_losses.losses, 0) as losses,
    COALESCE(tm_wins.wins, 0) + COALESCE(tm_losses.losses, 0) as total_matches,
    CASE 
      WHEN COALESCE(tm_wins.wins, 0) + COALESCE(tm_losses.losses, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(tm_wins.wins, 0)::numeric / (COALESCE(tm_wins.wins, 0) + COALESCE(tm_losses.losses, 0))) * 100, 2)
    END as win_percentage,
    COALESCE(tm_wins.wins, 0) * 2 as total_score
  FROM tournament_registrations tr
  JOIN profiles p ON tr.user_id = p.user_id
  LEFT JOIN player_rankings pr ON tr.user_id = pr.user_id
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
),
results_with_rewards AS (
  SELECT 
    *,
    -- Correct ELO points based on TOURNAMENT_ELO_REWARDS
    CASE final_position
      WHEN 1 THEN 100  -- CHAMPION
      WHEN 2 THEN 50   -- RUNNER_UP  
      WHEN 3 THEN 25   -- THIRD_PLACE
      WHEN 4 THEN 12   -- FOURTH_PLACE
      WHEN 5 THEN 6    -- TOP_8
      WHEN 6 THEN 6    -- TOP_8
      WHEN 7 THEN 6    -- TOP_8
      WHEN 8 THEN 6    -- TOP_8
      ELSE 1           -- PARTICIPATION
    END as correct_elo_points,
    -- Correct SPA points based on rank and position
    CASE 
      WHEN final_position = 1 THEN -- CHAMPION
        CASE COALESCE(verified_rank, 'K')
          WHEN 'E+' THEN 1600
          WHEN 'E' THEN 1500
          WHEN 'F+' THEN 1425
          WHEN 'F' THEN 1350
          WHEN 'G+' THEN 1275
          WHEN 'G' THEN 1200
          WHEN 'H+' THEN 1150
          WHEN 'H' THEN 1100
          WHEN 'I+' THEN 1050
          WHEN 'I' THEN 1000
          WHEN 'K+' THEN 950
          ELSE 900 -- K
        END
      WHEN final_position = 2 THEN -- RUNNER_UP
        CASE COALESCE(verified_rank, 'K')
          WHEN 'E+' THEN 1200
          WHEN 'E' THEN 1100
          WHEN 'F+' THEN 1050
          WHEN 'F' THEN 1000
          WHEN 'G+' THEN 950
          WHEN 'G' THEN 900
          WHEN 'H+' THEN 875
          WHEN 'H' THEN 850
          WHEN 'I+' THEN 825
          WHEN 'I' THEN 800
          WHEN 'K+' THEN 750
          ELSE 700 -- K
        END
      WHEN final_position = 3 THEN -- THIRD_PLACE
        CASE COALESCE(verified_rank, 'K')
          WHEN 'E+' THEN 1000
          WHEN 'E' THEN 900
          WHEN 'F+' THEN 850
          WHEN 'F' THEN 800
          WHEN 'G+' THEN 750
          WHEN 'G' THEN 700
          WHEN 'H+' THEN 675
          WHEN 'H' THEN 650
          WHEN 'I+' THEN 625
          WHEN 'I' THEN 600
          WHEN 'K+' THEN 550
          ELSE 500 -- K
        END
      WHEN final_position = 4 THEN -- FOURTH_PLACE
        CASE COALESCE(verified_rank, 'K')
          WHEN 'E+' THEN 700
          WHEN 'E' THEN 650
          WHEN 'F+' THEN 575
          WHEN 'F' THEN 550
          WHEN 'G+' THEN 525
          WHEN 'G' THEN 500
          WHEN 'H+' THEN 475
          WHEN 'H' THEN 450
          WHEN 'I+' THEN 425
          WHEN 'I' THEN 400
          WHEN 'K+' THEN 375
          ELSE 350 -- K
        END
      WHEN final_position BETWEEN 5 AND 8 THEN -- TOP_8
        CASE COALESCE(verified_rank, 'K')
          WHEN 'E+' THEN 350
          WHEN 'E' THEN 320
          WHEN 'F+' THEN 295
          WHEN 'F' THEN 280
          WHEN 'G+' THEN 265
          WHEN 'G' THEN 250
          WHEN 'H+' THEN 220
          WHEN 'H' THEN 200
          WHEN 'I+' THEN 165
          WHEN 'I' THEN 150
          WHEN 'K+' THEN 135
          ELSE 120 -- K
        END
      ELSE -- PARTICIPATION
        CASE COALESCE(verified_rank, 'K')
          WHEN 'E+' THEN 130
          WHEN 'E' THEN 120
          WHEN 'F+' THEN 110
          WHEN 'F' THEN 110
          WHEN 'G+' THEN 100
          WHEN 'G' THEN 100
          WHEN 'H+' THEN 100
          WHEN 'H' THEN 100
          WHEN 'I+' THEN 100
          WHEN 'I' THEN 100
          WHEN 'K+' THEN 100
          ELSE 100 -- K
        END
    END as correct_spa_points
  FROM ranked_standings
)
-- Insert corrected results
INSERT INTO tournament_results (
  tournament_id,
  user_id,
  final_position,
  matches_played,
  matches_won,
  matches_lost,
  prize_money,
  elo_points_earned,
  performance_rating,
  created_at
)
SELECT 
  tournament_id,
  user_id,
  final_position,
  total_matches,
  wins,
  losses,
  -- Prize distribution: 1st = 500k, 2nd = 300k, 3rd = 200k
  CASE final_position
    WHEN 1 THEN 500000
    WHEN 2 THEN 300000  
    WHEN 3 THEN 200000
    ELSE 0
  END as prize_money,
  correct_elo_points,
  win_percentage,
  NOW()
FROM results_with_rewards;

-- Update player_rankings with correct ELO and SPA points
WITH tournament_rewards AS (
  SELECT 
    tr.user_id,
    rs.correct_elo_points,
    rs.correct_spa_points
  FROM tournament_results tr
  JOIN (
    SELECT 
      user_id,
      final_position,
      -- Recalculate rewards for update
      CASE final_position
        WHEN 1 THEN 100  -- CHAMPION ELO
        WHEN 2 THEN 50   -- RUNNER_UP ELO
        WHEN 3 THEN 25   -- THIRD_PLACE ELO
        WHEN 4 THEN 12   -- FOURTH_PLACE ELO
        WHEN 5 THEN 6    -- TOP_8 ELO
        WHEN 6 THEN 6    -- TOP_8 ELO
        WHEN 7 THEN 6    -- TOP_8 ELO
        WHEN 8 THEN 6    -- TOP_8 ELO
        ELSE 1           -- PARTICIPATION ELO
      END as correct_elo_points,
      CASE 
        WHEN final_position = 1 THEN 
          CASE COALESCE((SELECT verified_rank FROM player_rankings WHERE user_id = tournament_results.user_id), 'K')
            WHEN 'E+' THEN 1600 WHEN 'E' THEN 1500 WHEN 'F+' THEN 1425 WHEN 'F' THEN 1350
            WHEN 'G+' THEN 1275 WHEN 'G' THEN 1200 WHEN 'H+' THEN 1150 WHEN 'H' THEN 1100
            WHEN 'I+' THEN 1050 WHEN 'I' THEN 1000 WHEN 'K+' THEN 950 ELSE 900
          END
        WHEN final_position = 2 THEN 
          CASE COALESCE((SELECT verified_rank FROM player_rankings WHERE user_id = tournament_results.user_id), 'K')
            WHEN 'E+' THEN 1200 WHEN 'E' THEN 1100 WHEN 'F+' THEN 1050 WHEN 'F' THEN 1000
            WHEN 'G+' THEN 950 WHEN 'G' THEN 900 WHEN 'H+' THEN 875 WHEN 'H' THEN 850
            WHEN 'I+' THEN 825 WHEN 'I' THEN 800 WHEN 'K+' THEN 750 ELSE 700
          END
        WHEN final_position = 3 THEN 
          CASE COALESCE((SELECT verified_rank FROM player_rankings WHERE user_id = tournament_results.user_id), 'K')
            WHEN 'E+' THEN 1000 WHEN 'E' THEN 900 WHEN 'F+' THEN 850 WHEN 'F' THEN 800
            WHEN 'G+' THEN 750 WHEN 'G' THEN 700 WHEN 'H+' THEN 675 WHEN 'H' THEN 650
            WHEN 'I+' THEN 625 WHEN 'I' THEN 600 WHEN 'K+' THEN 550 ELSE 500
          END
        WHEN final_position = 4 THEN 
          CASE COALESCE((SELECT verified_rank FROM player_rankings WHERE user_id = tournament_results.user_id), 'K')
            WHEN 'E+' THEN 700 WHEN 'E' THEN 650 WHEN 'F+' THEN 575 WHEN 'F' THEN 550
            WHEN 'G+' THEN 525 WHEN 'G' THEN 500 WHEN 'H+' THEN 475 WHEN 'H' THEN 450
            WHEN 'I+' THEN 425 WHEN 'I' THEN 400 WHEN 'K+' THEN 375 ELSE 350
          END
        WHEN final_position BETWEEN 5 AND 8 THEN 
          CASE COALESCE((SELECT verified_rank FROM player_rankings WHERE user_id = tournament_results.user_id), 'K')
            WHEN 'E+' THEN 350 WHEN 'E' THEN 320 WHEN 'F+' THEN 295 WHEN 'F' THEN 280
            WHEN 'G+' THEN 265 WHEN 'G' THEN 250 WHEN 'H+' THEN 220 WHEN 'H' THEN 200
            WHEN 'I+' THEN 165 WHEN 'I' THEN 150 WHEN 'K+' THEN 135 ELSE 120
          END
        ELSE 
          CASE COALESCE((SELECT verified_rank FROM player_rankings WHERE user_id = tournament_results.user_id), 'K')
            WHEN 'E+' THEN 130 WHEN 'E' THEN 120 WHEN 'F+' THEN 110 WHEN 'F' THEN 110
            ELSE 100
          END
      END as correct_spa_points
    FROM tournament_results 
    WHERE tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa'
  ) rs ON tr.user_id = rs.user_id
  WHERE tr.tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa'
)
UPDATE player_rankings 
SET 
  elo_points = COALESCE(elo_points, 1000) + tr.correct_elo_points,
  spa_points = COALESCE(spa_points, 50) + tr.correct_spa_points,
  tournament_wins = CASE 
    WHEN (SELECT final_position FROM tournament_results WHERE user_id = player_rankings.user_id AND tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa') = 1 
    THEN COALESCE(tournament_wins, 0) + 1 
    ELSE COALESCE(tournament_wins, 0) 
  END,
  updated_at = NOW()
FROM tournament_rewards tr
WHERE player_rankings.user_id = tr.user_id;

-- Create SPA transaction records
INSERT INTO spa_transactions (
  user_id, 
  points, 
  transaction_type, 
  description, 
  reference_id, 
  reference_type,
  created_at
)
SELECT 
  tr.user_id,
  CASE 
    WHEN tr.final_position = 1 THEN 
      CASE COALESCE(pr.verified_rank, 'K')
        WHEN 'E+' THEN 1600 WHEN 'E' THEN 1500 WHEN 'F+' THEN 1425 WHEN 'F' THEN 1350
        WHEN 'G+' THEN 1275 WHEN 'G' THEN 1200 WHEN 'H+' THEN 1150 WHEN 'H' THEN 1100
        WHEN 'I+' THEN 1050 WHEN 'I' THEN 1000 WHEN 'K+' THEN 950 ELSE 900
      END
    WHEN tr.final_position = 2 THEN 
      CASE COALESCE(pr.verified_rank, 'K')
        WHEN 'E+' THEN 1200 WHEN 'E' THEN 1100 WHEN 'F+' THEN 1050 WHEN 'F' THEN 1000
        WHEN 'G+' THEN 950 WHEN 'G' THEN 900 WHEN 'H+' THEN 875 WHEN 'H' THEN 850
        WHEN 'I+' THEN 825 WHEN 'I' THEN 800 WHEN 'K+' THEN 750 ELSE 700
      END
    WHEN tr.final_position = 3 THEN 
      CASE COALESCE(pr.verified_rank, 'K')
        WHEN 'E+' THEN 1000 WHEN 'E' THEN 900 WHEN 'F+' THEN 850 WHEN 'F' THEN 800
        WHEN 'G+' THEN 750 WHEN 'G' THEN 700 WHEN 'H+' THEN 675 WHEN 'H' THEN 650
        WHEN 'I+' THEN 625 WHEN 'I' THEN 600 WHEN 'K+' THEN 550 ELSE 500
      END
    WHEN tr.final_position = 4 THEN 
      CASE COALESCE(pr.verified_rank, 'K')
        WHEN 'E+' THEN 700 WHEN 'E' THEN 650 WHEN 'F+' THEN 575 WHEN 'F' THEN 550
        WHEN 'G+' THEN 525 WHEN 'G' THEN 500 WHEN 'H+' THEN 475 WHEN 'H' THEN 450
        WHEN 'I+' THEN 425 WHEN 'I' THEN 400 WHEN 'K+' THEN 375 ELSE 350
      END
    WHEN tr.final_position BETWEEN 5 AND 8 THEN 
      CASE COALESCE(pr.verified_rank, 'K')
        WHEN 'E+' THEN 350 WHEN 'E' THEN 320 WHEN 'F+' THEN 295 WHEN 'F' THEN 280
        WHEN 'G+' THEN 265 WHEN 'G' THEN 250 WHEN 'H+' THEN 220 WHEN 'H' THEN 200
        WHEN 'I+' THEN 165 WHEN 'I' THEN 150 WHEN 'K+' THEN 135 ELSE 120
      END
    ELSE 
      CASE COALESCE(pr.verified_rank, 'K')
        WHEN 'E+' THEN 130 WHEN 'E' THEN 120 WHEN 'F+' THEN 110 WHEN 'F' THEN 110
        ELSE 100
      END
  END as spa_points,
  'tournament_completion',
  'Tournament completion reward - Position ' || tr.final_position,
  '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa',
  'tournament',
  NOW()
FROM tournament_results tr
LEFT JOIN player_rankings pr ON tr.user_id = pr.user_id
WHERE tr.tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa';