-- Create additional test challenges for different statuses and scenarios

-- Insert accepted challenges (ĐANG DIỄN RA)
INSERT INTO challenges (
  challenger_id,
  opponent_id,
  status,
  challenge_message,
  bet_points,
  race_to,
  challenge_type,
  expires_at
) VALUES 
(
  '519cf7c9-e112-40b2-9e4d-0cd44783ec9e', -- Phan Nam Long
  '18f6e853-b072-47fb-9c9a-e5d42a5446a5', -- Current user
  'accepted',
  'Trận đấu đã bắt đầu!',
  350,
  15,
  'sabo',
  NOW() + INTERVAL '24 hours'
),
(
  '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2', -- Phan Thị Bình
  '0e541971-640e-4a5e-881b-b7f98a2904f7', -- Đặng Linh Hải
  'accepted',
  'Cuộc chiến hạng cao!',
  500,
  18,
  'sabo',
  NOW() + INTERVAL '36 hours'
);

-- Insert scheduled challenges (SẮP DIỄN RA)
INSERT INTO challenges (
  challenger_id,
  opponent_id,
  status,
  challenge_message,
  bet_points,
  race_to,
  challenge_type,
  expires_at
) VALUES 
(
  '18f6e853-b072-47fb-9c9a-e5d42a5446a5', -- Current user
  '519cf7c9-e112-40b2-9e4d-0cd44783ec9e', -- Phan Nam Long
  'pending',
  'Thách đấu được lên lịch cho mai!',
  400,
  16,
  'standard',
  NOW() + INTERVAL '1 day'
),
(
  '0e541971-640e-4a5e-881b-b7f98a2904f7', -- Đặng Linh Hải
  '18f6e853-b072-47fb-9c9a-e5d42a5446a5', -- Current user
  'pending',
  'Hẹn gặp lại bạn cuối tuần!',
  250,
  12,
  'sabo',
  NOW() + INTERVAL '2 days'
);

-- Insert completed challenges (MỚI HOÀN THÀNH)
INSERT INTO challenges (
  challenger_id,
  opponent_id,
  status,
  challenge_message,
  bet_points,
  race_to,
  challenge_type,
  expires_at,
  completed_at
) VALUES 
(
  '18f6e853-b072-47fb-9c9a-e5d42a5446a5', -- Current user
  '519cf7c9-e112-40b2-9e4d-0cd44783ec9e', -- Phan Nam Long
  'completed',
  'Trận đấu kinh điển!',
  600,
  20,
  'sabo',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '30 minutes'
),
(
  '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2', -- Phan Thị Bình
  '18f6e853-b072-47fb-9c9a-e5d42a5446a5', -- Current user
  'completed',
  'Chiến thắng ngoạn mục!',
  300,
  14,
  'standard',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '1 hour'
),
(
  '0e541971-640e-4a5e-881b-b7f98a2904f7', -- Đặng Linh Hải
  '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2', -- Phan Thị Bình
  'completed',
  'Trận đấu hay ho!',
  150,
  10,
  'sabo',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '5 hours'
);

-- Insert more open challenges for variety (ĐANG TÌM ĐỐI THỦ)
INSERT INTO challenges (
  challenger_id,
  opponent_id,
  status,
  challenge_message,
  bet_points,
  race_to,
  challenge_type,
  expires_at
) VALUES 
(
  '519cf7c9-e112-40b2-9e4d-0cd44783ec9e', -- Phan Nam Long (like in the image)
  NULL, -- Open challenge
  'pending',
  'Thách đấu mở đang chờ người tham gia',
  300,
  14,
  'sabo',
  NOW() + INTERVAL '48 hours'
),
(
  '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2', -- Phan Thị Bình
  NULL, -- Open challenge
  'pending',
  'Ai dám thách đấu với tôi?',
  800,
  25,
  'sabo',
  NOW() + INTERVAL '48 hours'
),
(
  '0e541971-640e-4a5e-881b-b7f98a2904f7', -- Đặng Linh Hải
  NULL, -- Open challenge
  'pending',
  'Newbie tìm cao thủ chỉ giáo!',
  100,
  8,
  'standard',
  NOW() + INTERVAL '48 hours'
);