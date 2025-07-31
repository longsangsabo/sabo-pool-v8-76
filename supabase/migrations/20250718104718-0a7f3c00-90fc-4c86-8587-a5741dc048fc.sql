
-- Fix tournament "test1" data to match user's 2.8M VND configuration
-- Current data shows 13M total but user configured 2.8M
UPDATE tournaments 
SET 
  prize_distribution = jsonb_build_object(
    '1', 1400000,  -- 50% of 2.8M
    '2', 840000,   -- 30% of 2.8M  
    '3', 560000,   -- 20% of 2.8M
    'default', 0
  ),
  spa_points_config = jsonb_build_object(
    '1', 1000,
    '2', 700, 
    '3', 500,
    '4', 400,
    '5', 300,
    '6', 300,
    '7', 300,
    '8', 300,
    '9', 200,
    '10', 200,
    '11', 200,
    '12', 200,
    '13', 200,
    '14', 200,
    '15', 200,
    '16', 200,
    'default', 100
  ),
  elo_points_config = jsonb_build_object(
    '1', 100,
    '2', 50,
    '3', 25,
    '4', 12,
    '5', 6,
    '6', 6,
    '7', 6,
    '8', 6,
    '9', 3,
    '10', 3,
    '11', 3,
    '12', 3,
    '13', 3,
    '14', 3,
    '15', 3,
    '16', 3,
    'default', 1
  ),
  physical_prizes = jsonb_build_object(
    '1', jsonb_build_object('icon', '🏆', 'name', 'Cúp vô địch', 'color', 'text-tournament-gold'),
    '2', jsonb_build_object('icon', '🥈', 'name', 'Huy chương bạc', 'color', 'text-tournament-silver'),
    '3', jsonb_build_object('icon', '🥉', 'name', 'Huy chương đồng', 'color', 'text-tournament-bronze'),
    'default', jsonb_build_object('icon', '📜', 'name', 'Chứng nhận tham gia', 'color', 'text-muted-foreground')
  ),
  prize_pool = 2800000,  -- User's actual configuration
  updated_at = now()
WHERE name = 'test1';

-- Verify the update
SELECT 
  name,
  prize_pool,
  prize_distribution,
  spa_points_config->>'1' as champion_spa_points,
  elo_points_config->>'1' as champion_elo_points
FROM tournaments 
WHERE name = 'test1';
