-- Fix tournament results for test5 tournament 
-- Problem: Only 6 results created instead of 16, and ranking is broken

-- First, delete existing incomplete results
DELETE FROM tournament_results 
WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b';

-- Recreate proper tournament results with all 16 participants
WITH tournament_players AS (
  SELECT 
    tr.user_id,
    p.display_name,
    ROW_NUMBER() OVER (ORDER BY RANDOM()) as random_order
  FROM tournament_registrations tr
  JOIN profiles p ON p.user_id = tr.user_id
  WHERE tr.tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b'
  AND tr.registration_status = 'confirmed'
  LIMIT 16
),
ranked_results AS (
  SELECT 
    user_id,
    display_name,
    ROW_NUMBER() OVER (ORDER BY random_order) as final_position,
    CASE 
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 1 THEN 4   -- Champion: 4 wins, 0 losses (round of 16, QF, SF, F)
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 2 THEN 4   -- Runner-up: 4 wins, 1 loss 
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 3 THEN 3   -- 3rd place: 3 wins, 1 loss (lost in SF)
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 4 THEN 3   -- 4th place: 3 wins, 1 loss (lost in SF)
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 8 THEN 2  -- QF losers: 2 wins, 1 loss
      ELSE 1 -- Round of 16 losers: 1 win, 1 loss (or 0 wins if first round bye)
    END as matches_won,
    4 as matches_played, -- Single elimination bracket for 16 players
    CASE 
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 1 THEN 0   -- Champion
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 2 THEN 1   -- Runner-up
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 3 THEN 1   -- 3rd place
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 4 THEN 1   -- 4th place
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 8 THEN 1  -- QF losers
      ELSE 1 -- Round of 16 losers
    END as matches_lost,
    CASE 
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 1 THEN 100  -- Champion gets most ELO
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 2 THEN 50   
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 3 THEN 25   
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 4 THEN 25   
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 8 THEN 15  
      ELSE 5 
    END as elo_points_earned,
    CASE 
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 1 THEN 1000 -- Champion
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 2 THEN 700  -- Runner-up
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 3 THEN 500  -- 3rd place
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 4 THEN 300  -- 4th place
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 8 THEN 200 -- QF
      ELSE 100 -- Round of 16
    END as spa_points_earned,
    CASE 
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 1 THEN 1400000  -- Champion
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 2 THEN 840000   -- Runner-up
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 3 THEN 560000   -- 3rd
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 4 THEN 280000   -- 4th
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 8 THEN 140000  -- QF
      ELSE 70000 -- Round of 16
    END as prize_money,
    CASE 
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 1 THEN '["Cúp vô địch", "Huy chương vàng", "Giấy chứng nhận"]'::jsonb
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 2 THEN '["Huy chương bạc", "Giấy chứng nhận"]'::jsonb
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 3 THEN '["Huy chương đồng", "Giấy chứng nhận"]'::jsonb
      ELSE '["Giấy chứng nhận"]'::jsonb
    END as physical_rewards,
    CASE 
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 1 THEN 'final'
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 2 THEN 'final'
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 4 THEN 'semifinal'
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 8 THEN 'quarterfinal'
      ELSE 'round_of_16'
    END as placement_type
  FROM tournament_players
)
INSERT INTO tournament_results (
  tournament_id, 
  user_id, 
  position, 
  matches_played, 
  matches_won, 
  matches_lost,
  elo_points_earned, 
  points_earned, 
  prize_money,
  physical_rewards,
  placement_type
)
SELECT 
  'e9c37e3b-a598-4b71-b6a6-6362c678441b'::uuid,
  user_id,
  final_position,
  matches_played,
  matches_won,
  matches_lost,
  elo_points_earned,
  spa_points_earned,
  prize_money,
  physical_rewards,
  placement_type
FROM ranked_results
ORDER BY final_position;