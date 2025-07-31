-- Fix club management access for user with correct JSONB casting
-- First ensure the user has a club_profiles entry
INSERT INTO public.club_profiles (
  user_id,
  club_name,
  verification_status,
  description,
  phone,
  address,
  created_at,
  updated_at
)
SELECT 
  'd7d6ce12-490f-4fff-b913-80044de5e169',
  'Sabo Billiards Club',
  'approved',
  'Câu lạc bộ bi-a chuyên nghiệp tại TP.HCM',
  '0901234567',
  '123 Nguyễn Văn Cừ, Quận 1, TP.HCM',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.club_profiles 
  WHERE user_id = 'd7d6ce12-490f-4fff-b913-80044de5e169'
);

-- Add some sample instructors for the club
INSERT INTO public.club_instructors (
  club_id,
  full_name,
  email,
  phone,
  experience_years,
  specializations,
  bio,
  is_active
)
SELECT 
  cp.id,
  'Nguyễn Văn A',
  'instructor1@saboclub.com',
  '0912345678',
  5,
  ARRAY['8-ball', '9-ball', 'snooker'],
  'Giảng viên có 5 năm kinh nghiệm, chuyên môn hướng dẫn các hạng từ K đến AA',
  true
FROM public.club_profiles cp
WHERE cp.user_id = 'd7d6ce12-490f-4fff-b913-80044de5e169'
AND NOT EXISTS (
  SELECT 1 FROM public.club_instructors 
  WHERE club_id = cp.id
);

-- Add some sample facilities with proper JSONB casting
INSERT INTO public.club_facilities (
  club_id,
  facility_name,
  facility_type,
  facility_code,
  specifications,
  status,
  condition_rating
)
SELECT 
  cp.id,
  facility_data.name,
  facility_data.type,
  facility_data.code,
  facility_data.specs::jsonb,
  'active',
  facility_data.rating
FROM public.club_profiles cp
CROSS JOIN (
  VALUES 
    ('Bàn Pool 1', 'pool_table', 'P001', '{"brand": "Diamond", "size": "9ft", "cloth": "Simonis"}', 5),
    ('Bàn Pool 2', 'pool_table', 'P002', '{"brand": "Diamond", "size": "9ft", "cloth": "Simonis"}', 4),
    ('Bàn Snooker 1', 'snooker_table', 'S001', '{"brand": "Riley", "size": "12ft", "cloth": "Strachan"}', 5),
    ('Khu nghỉ ngơi', 'seating_area', 'R001', '{"capacity": 20, "amenities": ["AC", "WiFi"]}', 4)
) AS facility_data(name, type, code, specs, rating)
WHERE cp.user_id = 'd7d6ce12-490f-4fff-b913-80044de5e169'
AND NOT EXISTS (
  SELECT 1 FROM public.club_facilities 
  WHERE club_id = cp.id
);