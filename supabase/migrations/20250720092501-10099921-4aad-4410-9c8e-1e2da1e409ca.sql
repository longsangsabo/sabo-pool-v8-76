-- Create demo tournament results for test2 tournament
-- First create some sample results since there are no results yet

-- Check if we have registrations for this tournament
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
  tr.user_id,
  ROW_NUMBER() OVER (ORDER BY RANDOM()) as final_position,
  8 as matches_played,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 1 THEN 8
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 2 THEN 7
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 3 THEN 6
    ELSE FLOOR(RANDOM() * 5) + 1
  END as matches_won,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 1 THEN 0
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 2 THEN 1
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 3 THEN 2
    ELSE FLOOR(RANDOM() * 4) + 3
  END as matches_lost,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 1 THEN 100
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 2 THEN 50
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 3 THEN 25
    ELSE FLOOR(RANDOM() * 15) + 5
  END as elo_points_earned,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 1 THEN 1000
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 2 THEN 700
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 3 THEN 500
    ELSE FLOOR(RANDOM() * 200) + 100
  END as spa_points_earned,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 1 THEN 5000000
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 2 THEN 3000000
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) = 3 THEN 1500000
    ELSE FLOOR(RANDOM() * 500000) + 100000
  END as prize_money,
  RANDOM() * 100 as performance_rating
FROM tournament_registrations tr 
WHERE tr.tournament_id = 'acd33d20-b841-474d-a754-31a33647cc93'
AND tr.registration_status = 'confirmed'
LIMIT 16
ON CONFLICT (tournament_id, user_id) DO NOTHING;

-- Now update tournament status to completed
UPDATE tournaments 
SET status = 'completed', updated_at = NOW()
WHERE id = 'acd33d20-b841-474d-a754-31a33647cc93';