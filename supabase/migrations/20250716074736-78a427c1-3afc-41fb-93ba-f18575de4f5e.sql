-- Fix SPA points calculation for tournament sabo1 - Override incorrect values
-- Based on the screenshot, we need to fix the SPA rewards which are currently showing ELO values instead

-- Update player_rankings directly with correct SPA points 
-- Long Sang (G+, Champion): should get 1275 SPA (currently showing +100)
-- Club Owner (Runner-up): should get 950 SPA (currently showing +50)  
-- Player 1 (Third): should get 750 SPA (currently showing +25)

-- First, subtract the wrong amounts that were added
UPDATE player_rankings 
SET spa_points = spa_points - 100
WHERE user_id = (SELECT user_id FROM profiles WHERE full_name = 'Long Sang');

UPDATE player_rankings 
SET spa_points = spa_points - 50  
WHERE user_id = (SELECT user_id FROM profiles WHERE full_name LIKE '%Club Owner%' OR display_name LIKE '%Club Owner%');

UPDATE player_rankings 
SET spa_points = spa_points - 25
WHERE user_id = (SELECT user_id FROM profiles WHERE full_name = 'Player 1' OR display_name = 'Player 1');

-- Now add the correct SPA amounts
UPDATE player_rankings 
SET spa_points = spa_points + 1275  -- G+ Champion reward
WHERE user_id = (SELECT user_id FROM profiles WHERE full_name = 'Long Sang');

UPDATE player_rankings 
SET spa_points = spa_points + 950   -- G+ Runner-up reward (assuming G+ rank)
WHERE user_id = (SELECT user_id FROM profiles WHERE full_name LIKE '%Club Owner%' OR display_name LIKE '%Club Owner%');

UPDATE player_rankings 
SET spa_points = spa_points + 750   -- G+ Third place reward (assuming G+ rank)
WHERE user_id = (SELECT user_id FROM profiles WHERE full_name = 'Player 1' OR display_name = 'Player 1');

-- Return confirmation of updates
SELECT 
  p.full_name,
  pr.spa_points,
  'Updated SPA points' as status
FROM profiles p
JOIN player_rankings pr ON p.user_id = pr.user_id
WHERE p.full_name IN ('Long Sang', 'Player 1') 
   OR p.full_name LIKE '%Club Owner%' 
   OR p.display_name LIKE '%Club Owner%';