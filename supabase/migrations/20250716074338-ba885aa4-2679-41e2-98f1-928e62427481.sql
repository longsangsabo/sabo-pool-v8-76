-- Check current tournament results for sabo1
SELECT 
  tr.user_id,
  tr.final_position,
  p.full_name,
  pr.verified_rank,
  tr.elo_points_earned,
  pr.spa_points,
  tr.prize_money
FROM tournament_results tr
JOIN profiles p ON tr.user_id = p.user_id  
LEFT JOIN player_rankings pr ON tr.user_id = pr.user_id
WHERE tr.tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa'
ORDER BY tr.final_position;