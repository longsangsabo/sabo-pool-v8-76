-- Create test data with correct column names

-- Add test tournaments with proper schema
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
  status,
  rules,
  venue_address,
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
  'registration_open',
  'Quy tắc quốc tế, best of 5 games từ vòng bán kết',
  'Trung tâm Thể thao Quận 3',
  NOW(),
  NOW()
);

-- Add sample posts to social feed
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
  'Chào mừng các bạn đến với SABO Pool Arena Hub! 🎱 Hệ thống quản lý giải đấu và thách đấu billiards chuyên nghiệp.',
  'announcement',
  '{"type": "welcome", "priority": "high"}',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
FROM profiles 
WHERE is_admin = true 
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
  'Giải đấu tháng 12 đã mở đăng ký! Entry fee chỉ 100k, giải thưởng tổng 2 triệu. Ai muốn tham gia không? 🏆',
  'tournament_registration',
  '{"tournament_name": "Giải đấu Tháng 12/2024", "entry_fee": 100000, "prize_pool": 2000000}',
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours'
FROM profiles 
WHERE is_admin = false 
LIMIT 1;

-- Add test notifications
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
  'Giải đấu sắp bắt đầu',
  'Giải đấu "Giải đấu Tháng 12/2024" sẽ bắt đầu trong 7 ngày. Đừng quên chuẩn bị!',
  '/tournaments',
  '{"tournament_name": "Giải đấu Tháng 12/2024", "days_remaining": 7}',
  'normal',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
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
  'welcome',
  'Chào mừng đến với SABO Pool Arena',
  'Cảm ơn bạn đã tham gia! Hãy khám phá các tính năng mới: Thách đấu, Giải đấu, và Bảng xếp hạng.',
  '/dashboard',
  '{"features": ["challenges", "tournaments", "leaderboard", "social"]}',
  'normal',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes'
FROM profiles 
WHERE is_admin = false 
OFFSET 1 LIMIT 1;