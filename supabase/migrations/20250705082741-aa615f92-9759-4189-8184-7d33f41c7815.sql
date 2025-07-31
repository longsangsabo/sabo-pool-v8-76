-- Create basic test data without constraint violations

-- Add welcome posts from admin
INSERT INTO posts (
  user_id,
  content,
  post_type,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'Chào mừng tất cả các bạn đến với SABO Pool Arena Hub! 🎱 Hệ thống quản lý giải đấu billiards chuyên nghiệp đã sẵn sàng phục vụ.',
  'text',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
FROM profiles 
WHERE is_admin = true 
LIMIT 1;

-- Add user posts
INSERT INTO posts (
  user_id,
  content,
  post_type,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'Mới tham gia hệ thống, rất vui được gặp mọi người! Ai muốn chơi thử một ván không? 😊',
  'text',
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours'
FROM profiles 
WHERE is_admin = false 
LIMIT 1;

INSERT INTO posts (
  user_id,
  content,
  post_type,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'Hôm nay tập luyện rất tốt! Cảm thấy kỹ năng đã cải thiện nhiều. Sẵn sàng cho những thách đấu mới! 💪🎱',
  'text',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
FROM profiles 
WHERE is_admin = false 
OFFSET 1 LIMIT 1;

-- Update some user profiles with basic info for testing
UPDATE profiles 
SET 
  city = 'TP. Hồ Chí Minh',
  district = 'Quận 1',
  skill_level = 'intermediate',
  updated_at = NOW()
WHERE is_admin = false;

-- Ensure all users have wallet records
INSERT INTO wallets (user_id, balance, created_at, updated_at)
SELECT user_id, 0, NOW(), NOW()
FROM profiles 
WHERE user_id NOT IN (SELECT user_id FROM wallets)
ON CONFLICT (user_id) DO NOTHING;