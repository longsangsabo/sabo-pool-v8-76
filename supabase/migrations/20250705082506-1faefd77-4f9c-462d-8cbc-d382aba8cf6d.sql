-- Create simplified test data that works with existing constraints

-- Add test tournaments first (no foreign key dependencies)
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

-- Add some sample posts for social feed
INSERT INTO posts (
  user_id,
  content,
  post_type,
  metadata,
  created_at,
  updated_at
)
VALUES 
(
  (SELECT user_id FROM profiles WHERE is_admin = false LIMIT 1),
  'Vừa hoàn thành trận đấu thú vị! Cảm ơn đối thủ đã có trận đấu fair play 🎱',
  'match_result',
  '{"match_type": "friendly", "score": "7-4", "duration": "45 minutes"}',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '3 hours'
),
(
  (SELECT user_id FROM profiles WHERE is_admin = false OFFSET 1 LIMIT 1),
  'Đăng ký tham gia giải đấu tháng 12 rồi! Ai cũng đi thi đấu không? 🏆',
  'tournament_registration',
  '{"tournament_name": "Giải đấu Tháng 12/2024", "registration_fee": "100000"}',
  NOW() - INTERVAL '5 hours',
  NOW() - INTERVAL '5 hours'
),
(
  (SELECT user_id FROM profiles WHERE is_admin = true LIMIT 1),
  'Chào mừng các bạn đến với hệ thống quản lý giải đấu SABO Pool Arena! 🎯',
  'announcement',
  '{"type": "welcome", "priority": "high"}',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
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
VALUES 
(
  (SELECT user_id FROM profiles WHERE is_admin = false LIMIT 1),
  'tournament_reminder',
  'Nhắc nhở giải đấu',
  'Giải đấu "Giải đấu Tháng 12/2024" sẽ bắt đầu trong 7 ngày. Hãy chuẩn bị sẵn sàng!',
  '/tournaments',
  '{"tournament_name": "Giải đấu Tháng 12/2024", "days_remaining": 7}',
  'normal',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
),
(
  (SELECT user_id FROM profiles WHERE is_admin = false OFFSET 1 LIMIT 1),
  'system_update',
  'Cập nhật hệ thống',
  'Hệ thống đã được cập nhật với nhiều tính năng mới. Hãy khám phá ngay!',
  '/dashboard',
  '{"version": "2.0", "features": ["tournaments", "challenges", "social_feed"]}',
  'normal',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
);

-- Create some initial player stats
INSERT INTO player_stats (
  player_id,
  matches_played,
  matches_won,
  matches_lost,
  win_rate,
  current_streak,
  longest_streak,
  total_points_won,
  total_points_lost,
  created_at,
  updated_at
)
SELECT 
  user_id,
  0, -- will be updated when real matches are played
  0,
  0,
  0.00,
  0,
  0,
  0,
  0,
  NOW(),
  NOW()
FROM profiles 
WHERE is_admin = false
ON CONFLICT (player_id) DO NOTHING;

-- Set default availability for all players
INSERT INTO player_availability (
  user_id,
  status,
  location,
  max_distance_km,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'available',
  'TP. Hồ Chí Minh',
  10,
  NOW(),
  NOW()
FROM profiles 
WHERE is_admin = false
ON CONFLICT (user_id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();