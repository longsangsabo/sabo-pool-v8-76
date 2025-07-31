-- Create test data with valid tournament types

-- Add test tournaments with valid tournament_type values
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
  'double_elimination',
  'registration_open',
  'Quy tắc quốc tế, best of 5 games từ vòng bán kết',
  'Trung tâm Thể thao Quận 3',
  NOW(),
  NOW()
);

-- Add some test posts with different content
INSERT INTO posts (
  user_id,
  content,
  post_type,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'Chào mừng tất cả các bạn đến với SABO Pool Arena Hub! 🎱',
  'announcement',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
FROM profiles 
WHERE is_admin = true 
LIMIT 1;

-- Add test notifications for users
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  priority,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'welcome',
  'Chào mừng đến với SABO Pool Arena',
  'Hệ thống đã sẵn sàng cho bạn khám phá!',
  'normal',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes'
FROM profiles 
WHERE is_admin = false 
LIMIT 2;