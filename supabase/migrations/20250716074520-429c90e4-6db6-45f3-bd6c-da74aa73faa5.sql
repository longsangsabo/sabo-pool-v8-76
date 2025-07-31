-- Check player rankings for users in sabo1 tournament
SELECT 
  p.full_name,
  pr.verified_rank,
  pr.spa_points,
  pr.elo_points
FROM tournament_registrations tr
JOIN profiles p ON tr.user_id = p.user_id
LEFT JOIN player_rankings pr ON tr.user_id = pr.user_id
WHERE tr.tournament_id = '7bf8b866-3f36-4f98-868d-f4b27b1ae6aa'
ORDER BY p.full_name;