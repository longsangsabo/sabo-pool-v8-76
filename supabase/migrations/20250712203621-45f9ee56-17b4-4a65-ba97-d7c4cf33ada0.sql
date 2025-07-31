-- Update rank definitions to match SABO standard with correct column names
UPDATE public.rank_definitions SET 
  rank_description = '2-4 bi khi hình dễ; mới tập',
  promotion_requirements = jsonb_build_object('requirements', ARRAY['2-4 bi khi hình dễ', 'Mới tập chơi', 'Biết luật cơ bản'])
WHERE rank_code = 'K';

UPDATE public.rank_definitions SET 
  rank_description = '2-4 bi khi hình dễ; biết luật, kê cơ đúng',
  promotion_requirements = jsonb_build_object('requirements', ARRAY['2-4 bi khi hình dễ', 'Biết luật', 'Kê cơ đúng'])
WHERE rank_code = 'K+';

UPDATE public.rank_definitions SET 
  rank_description = '3-5 bi; chưa điều được chấm',
  promotion_requirements = jsonb_build_object('requirements', ARRAY['3-5 bi', 'Chưa điều được chấm', 'Kỹ thuật cơ bản'])
WHERE rank_code = 'I';

UPDATE public.rank_definitions SET 
  rank_description = '3-5 bi; tân binh tiến bộ',
  promotion_requirements = jsonb_build_object('requirements', ARRAY['3-5 bi', 'Tân binh tiến bộ', 'Hiểu luật tốt hơn'])
WHERE rank_code = 'I+';

UPDATE public.rank_definitions SET 
  rank_description = 'Đi 5-8 bi; có thể "rùa" 1 chấm hình dễ',
  promotion_requirements = jsonb_build_object('requirements', ARRAY['Đi 5-8 bi', 'Có thể "rùa" 1 chấm hình dễ', 'Hiểu cơ bản về position'])
WHERE rank_code = 'H';

UPDATE public.rank_definitions SET 
  rank_description = 'Đi 5-8 bi; chuẩn bị lên G',
  promotion_requirements = jsonb_build_object('requirements', ARRAY['Đi 5-8 bi', 'Chuẩn bị lên G', 'Kỹ thuật ổn định hơn'])
WHERE rank_code = 'H+';

UPDATE public.rank_definitions SET 
  rank_description = 'Clear 1 chấm + 3-7 bi kế; bắt đầu điều bi 3 băng',
  promotion_requirements = jsonb_build_object('requirements', ARRAY['Clear 1 chấm + 3-7 bi kế', 'Bắt đầu điều bi 3 băng', 'Trình phong trào "ngon"'])
WHERE rank_code = 'G';

UPDATE public.rank_definitions SET 
  rank_description = 'Clear 1 chấm + 3-7 bi kế; trình phong trào "ngon"',
  promotion_requirements = jsonb_build_object('requirements', ARRAY['Clear 1 chấm + 3-7 bi kế', 'Trình phong trào "ngon"', 'Điều bi 3 băng khá'])
WHERE rank_code = 'G+';

UPDATE public.rank_definitions SET 
  rank_description = '60-80% clear 1 chấm, đôi khi phá 2 chấm',
  promotion_requirements = jsonb_build_object('requirements', ARRAY['60-80% clear 1 chấm', 'Đôi khi phá 2 chấm', 'Safety & spin control khá chắc'])
WHERE rank_code = 'F';

UPDATE public.rank_definitions SET 
  rank_description = '60-80% clear 1 chấm; cao nhất nhóm trung cấp',
  promotion_requirements = jsonb_build_object('requirements', ARRAY['60-80% clear 1 chấm', 'Cao nhất nhóm trung cấp', 'Safety & spin control chắc'])
WHERE rank_code = 'F+';

UPDATE public.rank_definitions SET 
  rank_description = '90-100% clear 1 chấm, 70% phá 2 chấm',
  promotion_requirements = jsonb_build_object('requirements', ARRAY['90-100% clear 1 chấm', '70% phá 2 chấm', 'Điều bi phức tạp, safety chủ động'])
WHERE rank_code = 'E';

UPDATE public.rank_definitions SET 
  rank_description = '90-100% clear 1 chấm; sát ngưỡng lên D (chưa mở)',
  promotion_requirements = jsonb_build_object('requirements', ARRAY['90-100% clear 1 chấm', '70% phá 2 chấm', 'Sát ngưỡng lên D (chưa mở)'])
WHERE rank_code = 'E+';