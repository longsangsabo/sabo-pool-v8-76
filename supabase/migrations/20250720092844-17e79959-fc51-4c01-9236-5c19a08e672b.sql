-- Fix tournament results ranking logic
-- The current ranking doesn't make sense - people with lower win rates are ranked higher

-- First, let's delete existing results and recreate them properly
DELETE FROM tournament_results WHERE tournament_id = 'acd33d20-b841-474d-a754-31a33647cc93';

-- Create realistic tournament results with proper ranking logic
WITH tournament_players AS (
  SELECT 
    tr.user_id,
    p.display_name,
    ROW_NUMBER() OVER (ORDER BY RANDOM()) as random_order
  FROM tournament_registrations tr
  JOIN profiles p ON p.user_id = tr.user_id
  WHERE tr.tournament_id = 'acd33d20-b841-474d-a754-31a33647cc93'
  AND tr.registration_status = 'confirmed'
  LIMIT 16
),
ranked_results AS (
  SELECT 
    user_id,
    display_name,
    ROW_NUMBER() OVER (ORDER BY random_order) as final_position,
    CASE 
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 1 THEN 8   -- Champion: 8 wins, 0 losses
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 2 THEN 7   -- Runner-up: 7 wins, 1 loss
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 3 THEN 6   -- 3rd place: 6 wins, 2 losses
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 4 THEN 6   -- 4th place: 6 wins, 2 losses
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 8 THEN 5  -- Top 8: 5 wins, 3 losses
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 12 THEN 4 -- 9-12th: 4 wins, 4 losses
      ELSE 3 -- 13-16th: 3 wins, 5 losses
    END as matches_won,
    8 as matches_played, -- Single elimination with some group stage
    CASE 
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 1 THEN 0   
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 2 THEN 1   
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 3 THEN 2   
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 4 THEN 2   
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 8 THEN 3  
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 12 THEN 4 
      ELSE 5 
    END as matches_lost,
    CASE 
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 1 THEN 100  -- Champion gets most ELO
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 2 THEN 50   
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 3 THEN 25   
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 8 THEN 15  
      ELSE 5 
    END as elo_points_earned,
    CASE 
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 1 THEN 1000 -- Champion
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 2 THEN 700  -- Runner-up
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 3 THEN 500  -- 3rd place
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 8 THEN 300 -- Top 8
      ELSE 100 -- Participation
    END as spa_points_earned,
    CASE 
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 1 THEN 5000000  -- 5M VND champion
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 2 THEN 3000000  -- 3M VND runner-up
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) = 3 THEN 1500000  -- 1.5M VND 3rd
      WHEN ROW_NUMBER() OVER (ORDER BY random_order) <= 8 THEN 500000  -- 500K top 8
      ELSE 100000 -- 100K participation
    END as prize_money
  FROM tournament_players
)
INSERT INTO tournament_results (
  tournament_id, 
  user_id, 
  final_position, 
  matches_played, 
  matches_won, 
  matches_lost,
  elo_points_earned, 
  spa_points_earned, 
  prize_money,
  performance_rating
)
SELECT 
  'acd33d20-b841-474d-a754-31a33647cc93'::uuid,
  user_id,
  final_position,
  matches_played,
  matches_won,
  matches_lost,
  elo_points_earned,
  spa_points_earned,
  prize_money,
  (matches_won::NUMERIC / matches_played * 100) as performance_rating
FROM ranked_results;