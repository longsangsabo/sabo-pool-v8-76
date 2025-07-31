-- Thêm trận tranh hạng 3-4 vào vòng 4 cho Test Tournament
INSERT INTO public.tournament_matches (
  tournament_id,
  round_number,
  match_number,
  is_third_place_match,
  status,
  created_at,
  updated_at
) VALUES (
  '727a8ae8-0598-47bf-b305-2fc2bc60b57d',
  4, -- Vòng 4
  3, -- Match số 3 trong vòng 4
  true, -- Đây là trận tranh hạng 3
  'scheduled',
  now(),
  now()
);