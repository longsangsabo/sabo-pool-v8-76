-- Manually create tournament results for test3 since automation is not working
WITH final_match AS (
  SELECT winner_id, 
         CASE WHEN winner_id = player1_id THEN player2_id ELSE player1_id END as runner_up_id
  FROM tournament_matches
  WHERE tournament_id = '917c205b-ac34-4dc1-b84a-6477a562913b'
  AND round_number = 4 
  AND status = 'completed'
  AND winner_id IS NOT NULL
  LIMIT 1
),
third_place_match AS (
  SELECT winner_id as third_place_id,
         CASE WHEN winner_id = player1_id THEN player2_id ELSE player1_id END as fourth_place_id
  FROM tournament_matches
  WHERE tournament_id = '917c205b-ac34-4dc1-b84a-6477a562913b'
  AND is_third_place_match = true
  AND status = 'completed'
  AND winner_id IS NOT NULL
  LIMIT 1
),
all_participants AS (
  SELECT DISTINCT user_id
  FROM tournament_registrations
  WHERE tournament_id = '917c205b-ac34-4dc1-b84a-6477a562913b'
  AND registration_status = 'confirmed'
),
participant_stats AS (
  SELECT 
    ap.user_id,
    COUNT(CASE WHEN tm.winner_id = ap.user_id THEN 1 END) as wins,
    COUNT(CASE WHEN tm.status = 'completed' AND (tm.player1_id = ap.user_id OR tm.player2_id = ap.user_id) AND tm.winner_id != ap.user_id THEN 1 END) as losses,
    COUNT(CASE WHEN tm.status = 'completed' AND (tm.player1_id = ap.user_id OR tm.player2_id = ap.user_id) THEN 1 END) as total_matches
  FROM all_participants ap
  LEFT JOIN tournament_matches tm ON 
    (tm.player1_id = ap.user_id OR tm.player2_id = ap.user_id)
    AND tm.tournament_id = '917c205b-ac34-4dc1-b84a-6477a562913b'
    AND tm.status = 'completed'
  GROUP BY ap.user_id
),
position_assigned AS (
  SELECT 
    ps.*,
    CASE 
      WHEN ps.user_id = (SELECT winner_id FROM final_match) THEN 1
      WHEN ps.user_id = (SELECT runner_up_id FROM final_match) THEN 2  
      WHEN ps.user_id = (SELECT third_place_id FROM third_place_match) THEN 3
      WHEN ps.user_id = (SELECT fourth_place_id FROM third_place_match) THEN 4
      ELSE 5 + ROW_NUMBER() OVER (ORDER BY ps.wins DESC, ps.losses ASC)
    END as final_position
  FROM participant_stats ps
)
INSERT INTO tournament_results (
  tournament_id, user_id, final_position,
  matches_played, matches_won, matches_lost,
  spa_points_earned, elo_points_earned, prize_money
)
SELECT 
  '917c205b-ac34-4dc1-b84a-6477a562913b',
  pa.user_id,
  pa.final_position,
  pa.total_matches,
  pa.wins,
  pa.losses,
  CASE pa.final_position
    WHEN 1 THEN 1000  -- Champion SPA points
    WHEN 2 THEN 700   -- Runner-up SPA points
    WHEN 3 THEN 500   -- Third place SPA points  
    WHEN 4 THEN 400   -- Fourth place SPA points
    ELSE 200          -- Other positions
  END as spa_points,
  CASE pa.final_position
    WHEN 1 THEN 100   -- Champion ELO points
    WHEN 2 THEN 50    -- Runner-up ELO points
    WHEN 3 THEN 25    -- Third place ELO points
    WHEN 4 THEN 12    -- Fourth place ELO points
    ELSE 5            -- Other positions get 5 ELO points
  END as elo_points,
  CASE pa.final_position
    WHEN 1 THEN 5000000   -- Champion prize money
    WHEN 2 THEN 3000000   -- Runner-up prize money
    WHEN 3 THEN 2000000   -- Third place prize money
    WHEN 4 THEN 1000000   -- Fourth place prize money
    ELSE 0                -- No prize money for other positions
  END as prize_money
FROM position_assigned pa;