-- Create test data for complete system testing

-- Add sample matches between existing users
INSERT INTO matches (
  player1_id, 
  player2_id, 
  winner_id,
  score_player1,
  score_player2,
  status, 
  played_at,
  created_at,
  updated_at
)
SELECT 
  p1.user_id,
  p2.user_id,
  p1.user_id, -- player1 wins
  7, -- score for player1
  5, -- score for player2
  'completed',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
FROM 
  (SELECT user_id FROM profiles WHERE is_admin = false LIMIT 1) p1,
  (SELECT user_id FROM profiles WHERE is_admin = false OFFSET 1 LIMIT 1) p2
WHERE p1.user_id != p2.user_id;

-- Add another match with different outcome
INSERT INTO matches (
  player1_id, 
  player2_id, 
  winner_id,
  score_player1,
  score_player2,
  status, 
  played_at,
  created_at,
  updated_at
)
SELECT 
  p1.user_id,
  p2.user_id,
  p2.user_id, -- player2 wins this time
  4, -- score for player1
  7, -- score for player2
  'completed',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
FROM 
  (SELECT user_id FROM profiles WHERE is_admin = false LIMIT 1) p1,
  (SELECT user_id FROM profiles WHERE is_admin = false OFFSET 1 LIMIT 1) p2
WHERE p1.user_id != p2.user_id;

-- Add sample challenges between users
INSERT INTO challenges (
  challenger_id, 
  opponent_id, 
  status,
  bet_points,
  race_to,
  stake_type,
  message,
  location,
  scheduled_time,
  created_at,
  updated_at
)
SELECT 
  p1.user_id,
  p2.user_id,
  'pending',
  100,
  7,
  'friendly',
  'Thách đấu tối nay bạn nhé!',
  'CLB Bida ABC',
  NOW() + INTERVAL '1 day',
  NOW(),
  NOW()
FROM 
  (SELECT user_id FROM profiles WHERE is_admin = false LIMIT 1) p1,
  (SELECT user_id FROM profiles WHERE is_admin = false OFFSET 2 LIMIT 1) p2
WHERE p1.user_id != p2.user_id;

-- Add accepted challenge
INSERT INTO challenges (
  challenger_id, 
  opponent_id, 
  status,
  bet_points,
  race_to,
  stake_type,
  message,
  response_message,
  location,
  scheduled_time,
  responded_at,
  created_at,
  updated_at
)
SELECT 
  p1.user_id,
  p2.user_id,
  'accepted',
  50,
  5,
  'friendly',
  'Đấu không bạn?',
  'OK, tôi nhận lời!',
  'CLB Pool Pro',
  NOW() + INTERVAL '3 hours',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '30 minutes'
FROM 
  (SELECT user_id FROM profiles WHERE is_admin = false OFFSET 1 LIMIT 1) p1,
  (SELECT user_id FROM profiles WHERE is_admin = false OFFSET 2 LIMIT 1) p2
WHERE p1.user_id != p2.user_id;

-- Add test tournaments
INSERT INTO tournaments (
  name,
  description,
  start_date,
  end_date,
  registration_deadline,
  max_participants,
  entry_fee,
  prize_pool,
  tournament_type,
  format,
  status,
  rules,
  location,
  created_at,
  updated_at
)
VALUES 
(
  'Giải đấu Tháng 12/2024',
  'Giải đấu pool 8 bi hàng tháng dành cho tất cả các level',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '10 days', 
  NOW() + INTERVAL '5 days',
  32,
  100000,
  2000000,
  'elimination',
  'single_elimination',
  'upcoming',
  'Quy tắc pool 8 bi tiêu chuẩn, best of 3 games',
  'CLB Bida Sài Gòn, Quận 1',
  NOW(),
  NOW()
),
(
  'Giải Vô Địch Mùa Đông 2024',
  'Giải đấu lớn cuối năm với giải thưởng hấp dẫn',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '17 days',
  NOW() + INTERVAL '12 days', 
  64,
  200000,
  5000000,
  'elimination',
  'double_elimination',
  'registration_open',
  'Quy tắc quốc tế, best of 5 games từ vòng bán kết',
  'Trung tâm Thể thao Quận 3',
  NOW(),
  NOW()
),
(
  'Giải Giao Hữu Tháng 11',
  'Giải đấu đã kết thúc để test dữ liệu',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '17 days',
  NOW() - INTERVAL '22 days',
  16,
  50000,
  500000,
  'round_robin',
  'round_robin',
  'completed',
  'Round robin format, mỗi người chơi với tất cả',
  'CLB Bida Tân Bình',
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '17 days'
);

-- Add some tournament registrations
INSERT INTO tournament_registrations (
  tournament_id,
  player_id,
  registration_status,
  registered_at,
  created_at,
  updated_at
)
SELECT 
  t.id,
  p.user_id,
  'confirmed',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
FROM 
  tournaments t,
  profiles p
WHERE 
  t.name = 'Giải đấu Tháng 12/2024'
  AND p.is_admin = false
  AND p.user_id IN (
    SELECT user_id FROM profiles WHERE is_admin = false LIMIT 2
  );

-- Add some sample posts for social feed
INSERT INTO posts (
  user_id,
  content,
  post_type,
  metadata,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'Vừa hoàn thành trận đấu thú vị! Cảm ơn đối thủ đã có trận đấu fair play 🎱',
  'match_result',
  jsonb_build_object(
    'match_type', 'friendly',
    'score', '7-4',
    'duration', '45 minutes'
  ),
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '3 hours'
FROM profiles 
WHERE is_admin = false 
LIMIT 1;

INSERT INTO posts (
  user_id,
  content,
  post_type,
  metadata,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'Đăng ký tham gia giải đấu tháng 12 rồi! Ai cũng đi thi đấu không? 🏆',
  'tournament_registration',
  jsonb_build_object(
    'tournament_name', 'Giải đấu Tháng 12/2024',
    'registration_fee', '100000'
  ),
  NOW() - INTERVAL '5 hours',
  NOW() - INTERVAL '5 hours'
FROM profiles 
WHERE is_admin = false 
OFFSET 1 LIMIT 1;

-- Update player stats based on the matches we created
UPDATE player_stats 
SET 
  matches_played = 2,
  matches_won = 1,
  matches_lost = 1,
  win_rate = 50.00,
  current_streak = 0,
  last_match_date = NOW() - INTERVAL '1 day',
  updated_at = NOW()
WHERE player_id IN (
  SELECT user_id FROM profiles WHERE is_admin = false LIMIT 2
);

-- Add some notifications for testing
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  action_url,
  metadata,
  priority,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'challenge_received',
  'Thách đấu mới',
  'Bạn có một lời thách đấu mới! Hãy vào xem và phản hồi.',
  '/challenges',
  jsonb_build_object(
    'challenger_name', 'Test Player',
    'bet_points', 100
  ),
  'normal',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
FROM profiles 
WHERE is_admin = false 
LIMIT 1;

INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  action_url,
  metadata,
  priority,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'tournament_reminder',
  'Nhắc nhở giải đấu',
  'Giải đấu "Giải đấu Tháng 12/2024" sẽ bắt đầu trong 7 ngày. Hãy chuẩn bị sẵn sàng!',
  '/tournaments',
  jsonb_build_object(
    'tournament_name', 'Giải đấu Tháng 12/2024',
    'days_remaining', 7
  ),
  'normal',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
FROM profiles 
WHERE is_admin = false 
OFFSET 1 LIMIT 1;