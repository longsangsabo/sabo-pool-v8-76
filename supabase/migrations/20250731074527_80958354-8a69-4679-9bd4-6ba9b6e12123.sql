-- Update some users to have SPA points to test challenge system
UPDATE player_rankings 
SET spa_points = 500 + (random() * 1500)::integer,
    elo_points = 1000 + (random() * 500)::integer,
    updated_at = NOW()
WHERE user_id IN (
  SELECT user_id 
  FROM profiles 
  WHERE is_demo_user = false 
  LIMIT 10
);

-- Create a few more test challenges with better data
DO $$
DECLARE
  users_array UUID[];
  i INTEGER;
  j INTEGER;
BEGIN
  -- Get active users with SPA points
  SELECT ARRAY(
    SELECT user_id 
    FROM player_rankings pr
    JOIN profiles p ON pr.user_id = p.user_id 
    WHERE p.is_demo_user = false 
    AND pr.spa_points >= 100
    LIMIT 8
  ) INTO users_array;
  
  -- Create challenges between different users
  FOR i IN 1..array_length(users_array, 1) LOOP
    FOR j IN 1..array_length(users_array, 1) LOOP
      IF i != j AND random() < 0.3 THEN  -- 30% chance of creating challenge
        INSERT INTO challenges (
          challenger_id,
          opponent_id,
          bet_points,
          race_to,
          message,
          status,
          expires_at,
          created_at
        ) VALUES (
          users_array[i],
          users_array[j],
          CASE 
            WHEN random() < 0.4 THEN 100
            WHEN random() < 0.7 THEN 200
            ELSE 300
          END,
          CASE 
            WHEN random() < 0.5 THEN 5
            WHEN random() < 0.8 THEN 8
            ELSE 10
          END,
          CASE 
            WHEN random() < 0.3 THEN 'Thách đấu hấp dẫn!'
            WHEN random() < 0.6 THEN 'Đấu không?'
            WHEN random() < 0.8 THEN 'Chúng ta so tài nhé!'
            ELSE NULL
          END,
          CASE 
            WHEN random() < 0.4 THEN 'pending'
            WHEN random() < 0.7 THEN 'accepted'
            ELSE 'completed'
          END,
          NOW() + INTERVAL '7 days',
          NOW() - (random() * INTERVAL '5 days')
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;