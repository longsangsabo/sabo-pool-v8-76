-- Create test data for challenges page debugging
INSERT INTO public.challenges (
  id,
  challenger_id,
  opponent_id,
  status,
  bet_points,
  race_to,
  created_at,
  responded_at,
  message
) VALUES (
  gen_random_uuid(),
  (SELECT user_id FROM profiles LIMIT 1),
  (SELECT user_id FROM profiles WHERE user_id != (SELECT user_id FROM profiles LIMIT 1) LIMIT 1),
  'accepted',
  100,
  8,
  NOW(),
  NOW(),
  'Test challenge để kiểm tra nút nhập tỷ số'
) ON CONFLICT DO NOTHING;