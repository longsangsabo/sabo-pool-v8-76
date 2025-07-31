-- Update tournament_results with correct SPA points for sabo1
UPDATE tournament_results 
SET spa_points_earned = CASE final_position
  WHEN 1 THEN 1275  -- G+ Champion
  WHEN 2 THEN 950   -- G+ Runner-up  
  WHEN 3 THEN 750   -- G+ Third place
  ELSE 100          -- Participation
END
WHERE tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa';

-- Verify the update
SELECT 
  tr.final_position,
  p.full_name,
  tr.elo_points_earned as elo_change,
  tr.spa_points_earned as spa_points
FROM tournament_results tr
JOIN profiles p ON tr.user_id = p.user_id
WHERE tr.tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa'
ORDER BY tr.final_position;