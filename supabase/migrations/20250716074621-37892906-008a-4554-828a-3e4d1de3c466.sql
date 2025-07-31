-- Reset SPA points for sabo1 tournament participants to correct values
-- First check current spa points
WITH current_data AS (
  SELECT 
    p.full_name,
    pr.verified_rank,
    pr.spa_points,
    tr.final_position
  FROM tournament_registrations treg
  JOIN profiles p ON treg.user_id = p.user_id
  LEFT JOIN player_rankings pr ON treg.user_id = pr.user_id
  LEFT JOIN tournament_results tr ON treg.user_id = tr.user_id AND tr.tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa'
  WHERE treg.tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa'
  AND treg.status = 'confirmed'
),
expected_spa AS (
  SELECT 
    full_name,
    verified_rank,
    spa_points as current_spa,
    final_position,
    CASE 
      WHEN final_position = 1 THEN -- CHAMPION
        CASE COALESCE(verified_rank, 'K')
          WHEN 'G+' THEN 1275
          WHEN 'G' THEN 1200
          WHEN 'K' THEN 900
          ELSE 1000
        END
      WHEN final_position = 2 THEN -- RUNNER_UP  
        CASE COALESCE(verified_rank, 'K')
          WHEN 'G+' THEN 950
          WHEN 'G' THEN 900
          WHEN 'K' THEN 700
          ELSE 800
        END
      WHEN final_position = 3 THEN -- THIRD_PLACE
        CASE COALESCE(verified_rank, 'K')
          WHEN 'G+' THEN 750
          WHEN 'G' THEN 700
          WHEN 'K' THEN 500
          ELSE 600
        END
      ELSE 100 -- PARTICIPATION
    END as expected_spa_reward
  FROM current_data
)
SELECT 
  full_name,
  verified_rank, 
  final_position,
  current_spa,
  expected_spa_reward,
  (current_spa - expected_spa_reward) as spa_difference
FROM expected_spa
ORDER BY final_position;