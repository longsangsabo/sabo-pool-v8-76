-- Update the incorrect SPA points for Sabo 2 tournament to use E-rank rewards
UPDATE tournament_results SET 
  spa_points_earned = CASE 
    WHEN final_position = 1 THEN 1500  -- E-rank Champion
    WHEN final_position = 2 THEN 1100  -- E-rank Runner-up
    WHEN final_position = 3 THEN 900   -- E-rank Third place
    WHEN final_position = 4 THEN 650   -- E-rank Fourth place
    WHEN final_position <= 8 THEN 320  -- E-rank Top 8
    ELSE 120                           -- E-rank Participation
  END
WHERE tournament_id = '5386eecb-1970-4561-a412-3cb1da7af588';