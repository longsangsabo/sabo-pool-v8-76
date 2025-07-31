-- Insert test open challenges from other users
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
  NULL, -- Open challenge
  'pending',
  'Ai dám đấu với tôi không?',
  400,
  16,
  'sabo',
  NOW() + INTERVAL '48 hours'
),
(
  '4bedc2fd-a85d-483d-80e5-c9541d6ecdc2', -- Phan Thị Bình  
  NULL, -- Open challenge
  'pending',
  'Thách đấu cấp cao - 500 điểm',
  500,
  18,
  'sabo',
  NOW() + INTERVAL '48 hours'
),
(
  '0e541971-640e-4a5e-881b-b7f98a2904f7', -- Đặng Linh Hải
  NULL, -- Open challenge
  'pending',
  'Newbie tìm đối thủ!',
  200,
  12,
  'sabo',
  NOW() + INTERVAL '48 hours'
);