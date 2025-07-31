-- Create test data with correct tournament schema

-- Add test tournaments with existing columns only
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
  'completed',
  'Round robin format, mỗi người chơi với tất cả',
  'CLB Bida Tân Bình',
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '17 days'
);

-- Add sample notifications for testing
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
  'Giải đấu "Giải đấu Tháng 12/2024" sẽ bắt đầu trong 7 ngày. Hãy chuẩ bị sẵn sàng!',
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
  'system_update',
  'Cập nhật hệ thống',
  'Hệ thống đã được cập nhật với nhiều tính năng mới. Hãy khám phá ngay!',
  '/dashboard',
  '{"version": "2.0", "features": ["tournaments", "challenges", "social_feed"]}',
  'normal',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
FROM profiles 
WHERE is_admin = false 
OFFSET 1 LIMIT 1;