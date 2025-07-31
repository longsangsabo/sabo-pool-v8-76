-- Fix tournament_results table and create results for test1
-- Add missing updated_at column
ALTER TABLE tournament_results 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create tournament results for test1 tournament manually
WITH registered_participants AS (
  SELECT 
    tr.user_id,
    p.full_name,
    ROW_NUMBER() OVER (ORDER BY tr.created_at) as position
  FROM tournament_registrations tr
  JOIN profiles p ON tr.user_id = p.user_id
  WHERE tr.tournament_id = 'd5787f54-a1f4-4712-b08d-9dd551b7f08d'
    AND tr.registration_status = 'confirmed'
)
INSERT INTO tournament_results (
  tournament_id, user_id, final_position, 
  matches_played, matches_won, matches_lost,
  spa_points_earned, elo_points_earned, prize_money
)
SELECT 
  'd5787f54-a1f4-4712-b08d-9dd551b7f08d'::uuid,
  rp.user_id,
  rp.position,
  CASE 
    WHEN rp.position <= 8 THEN 3 + FLOOR(RANDOM() * 2)::INTEGER  
    WHEN rp.position <= 16 THEN 2 + FLOOR(RANDOM() * 2)::INTEGER 
    ELSE 1 + FLOOR(RANDOM() * 2)::INTEGER  
  END as matches_played,
  CASE 
    WHEN rp.position = 1 THEN 5  
    WHEN rp.position = 2 THEN 4  
    WHEN rp.position <= 4 THEN 3 
    WHEN rp.position <= 8 THEN 2 
    ELSE 1  
  END as matches_won,
  CASE 
    WHEN rp.position = 1 THEN 0  
    WHEN rp.position <= 4 THEN 1 
    WHEN rp.position <= 8 THEN 2 
    ELSE 2 + FLOOR(RANDOM() * 2)::INTEGER  
  END as matches_lost,
  -- SPA points from tournament config
  CASE 
    WHEN rp.position = 1 THEN 1000
    WHEN rp.position = 2 THEN 700
    WHEN rp.position = 3 THEN 500
    WHEN rp.position = 4 THEN 400
    WHEN rp.position <= 8 THEN 300
    WHEN rp.position <= 16 THEN 200
    ELSE 100
  END as spa_points_earned,
  -- ELO points
  CASE 
    WHEN rp.position = 1 THEN 100
    WHEN rp.position = 2 THEN 50
    WHEN rp.position = 3 THEN 25
    WHEN rp.position = 4 THEN 12
    WHEN rp.position <= 8 THEN 6
    WHEN rp.position <= 16 THEN 3
    ELSE 1
  END as elo_points_earned,
  -- Prize money from tournament config
  CASE 
    WHEN rp.position = 1 THEN 1400000  -- 50% of 2.8M
    WHEN rp.position = 2 THEN 840000   -- 30% of 2.8M
    WHEN rp.position = 3 THEN 560000   -- 20% of 2.8M
    ELSE 0
  END as prize_money
FROM registered_participants rp
ON CONFLICT (tournament_id, user_id) DO UPDATE SET
  final_position = EXCLUDED.final_position,
  matches_played = EXCLUDED.matches_played,
  matches_won = EXCLUDED.matches_won,
  matches_lost = EXCLUDED.matches_lost,
  spa_points_earned = EXCLUDED.spa_points_earned,
  elo_points_earned = EXCLUDED.elo_points_earned,
  prize_money = EXCLUDED.prize_money,
  updated_at = NOW();