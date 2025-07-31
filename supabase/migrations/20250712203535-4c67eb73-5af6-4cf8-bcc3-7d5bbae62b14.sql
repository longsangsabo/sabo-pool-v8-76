-- Update rank definitions to match SABO standard
UPDATE public.rank_definitions SET 
  description = '2-4 bi khi hình dễ; mới tập',
  requirements = ARRAY['2-4 bi khi hình dễ', 'Mới tập chơi', 'Biết luật cơ bản']
WHERE code = 'K';

UPDATE public.rank_definitions SET 
  description = '2-4 bi khi hình dễ; biết luật, kê cơ đúng',
  requirements = ARRAY['2-4 bi khi hình dễ', 'Biết luật', 'Kê cơ đúng']
WHERE code = 'K+';

UPDATE public.rank_definitions SET 
  description = '3-5 bi; chưa điều được chấm',
  requirements = ARRAY['3-5 bi', 'Chưa điều được chấm', 'Kỹ thuật cơ bản']
WHERE code = 'I';

UPDATE public.rank_definitions SET 
  description = '3-5 bi; tân binh tiến bộ',
  requirements = ARRAY['3-5 bi', 'Tân binh tiến bộ', 'Hiểu luật tốt hơn']
WHERE code = 'I+';

UPDATE public.rank_definitions SET 
  description = 'Đi 5-8 bi; có thể "rùa" 1 chấm hình dễ',
  requirements = ARRAY['Đi 5-8 bi', 'Có thể "rùa" 1 chấm hình dễ', 'Hiểu cơ bản về position']
WHERE code = 'H';

UPDATE public.rank_definitions SET 
  description = 'Đi 5-8 bi; chuẩn bị lên G',
  requirements = ARRAY['Đi 5-8 bi', 'Chuẩn bị lên G', 'Kỹ thuật ổn định hơn']
WHERE code = 'H+';

UPDATE public.rank_definitions SET 
  description = 'Clear 1 chấm + 3-7 bi kế; bắt đầu điều bi 3 băng',
  requirements = ARRAY['Clear 1 chấm + 3-7 bi kế', 'Bắt đầu điều bi 3 băng', 'Trình phong trào "ngon"']
WHERE code = 'G';

UPDATE public.rank_definitions SET 
  description = 'Clear 1 chấm + 3-7 bi kế; trình phong trào "ngon"',
  requirements = ARRAY['Clear 1 chấm + 3-7 bi kế', 'Trình phong trào "ngon"', 'Điều bi 3 băng khá']
WHERE code = 'G+';

UPDATE public.rank_definitions SET 
  description = '60-80% clear 1 chấm, đôi khi phá 2 chấm',
  requirements = ARRAY['60-80% clear 1 chấm', 'Đôi khi phá 2 chấm', 'Safety & spin control khá chắc']
WHERE code = 'F';

UPDATE public.rank_definitions SET 
  description = '60-80% clear 1 chấm; cao nhất nhóm trung cấp',
  requirements = ARRAY['60-80% clear 1 chấm', 'Cao nhất nhóm trung cấp', 'Safety & spin control chắc']
WHERE code = 'F+';

UPDATE public.rank_definitions SET 
  description = '90-100% clear 1 chấm, 70% phá 2 chấm',
  requirements = ARRAY['90-100% clear 1 chấm', '70% phá 2 chấm', 'Điều bi phức tạp, safety chủ động']
WHERE code = 'E';

UPDATE public.rank_definitions SET 
  description = '90-100% clear 1 chấm; sát ngưỡng lên D (chưa mở)',
  requirements = ARRAY['90-100% clear 1 chấm', '70% phá 2 chấm', 'Sát ngưỡng lên D (chưa mở)']
WHERE code = 'E+';