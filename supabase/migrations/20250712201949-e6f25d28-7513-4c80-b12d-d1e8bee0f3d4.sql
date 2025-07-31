-- Fix rank definitions to use correct SABO system from qr.ts
DELETE FROM public.rank_definitions;

INSERT INTO public.rank_definitions (rank_code, rank_name, description, min_elo, max_elo, requirements, created_at) VALUES
('K', 'Hạng K', 'Có khả năng đi từ 2-3 bi ổn định', 800, 999, '["Đi được 2-3 bi ổn định", "Hiểu cơ bản về luật chơi"]', now()),
('K+', 'Hạng K+', 'Có khả năng đi từ 3-5 bi ổn định', 1000, 1099, '["Đi được 3-5 bi ổn định", "Cải thiện kỹ thuật cơ bản"]', now()),
('I', 'Hạng I', 'Có khả năng đi từ 4-6 bi ổn định', 1100, 1199, '["Đi được 4-6 bi ổn định", "Hiểu về chiến thuật cơ bản"]', now()),
('I+', 'Hạng I+', 'Có khả năng đi từ 5-8 bi ổn định', 1200, 1299, '["Đi được 5-8 bi ổn định", "Phát triển kỹ thuật nâng cao"]', now()),
('H', 'Hạng H', 'Có khả năng đi từ 6-10 bi ổn định', 1300, 1399, '["Đi được 6-10 bi ổn định", "Hiểu sâu về chiến thuật"]', now()),
('H+', 'Hạng H+', 'Có khả năng đi từ 8-12 bi ổn định', 1400, 1499, '["Đi được 8-12 bi ổn định", "Kỹ thuật tiên tiến"]', now()),
('G', 'Hạng G', 'Có khả năng đi từ 10-15 bi ổn định', 1500, 1599, '["Đi được 10-15 bi ổn định", "Chuyên gia về position play"]', now()),
('G+', 'Hạng G+', 'Có khả năng đi từ 12-18 bi ổn định', 1600, 1699, '["Đi được 12-18 bi ổn định", "Kỹ thuật chuyên nghiệp"]', now()),
('F', 'Hạng F', 'Có khả năng đi từ 15-25 bi ổn định', 1700, 1799, '["Đi được 15-25 bi ổn định", "Thành thạo mọi kỹ thuật"]', now()),
('F+', 'Hạng F+', 'Có khả năng đi từ 20-30 bi ổn định', 1800, 1899, '["Đi được 20-30 bi ổn định", "Kỹ thuật master level"]', now()),
('E', 'Hạng E', 'Có khả năng đi từ 25-40 bi ổn định', 1900, 1999, '["Đi được 25-40 bi ổn định", "Đẳng cấp semi-professional"]', now()),
('E+', 'Hạng E+', 'Có khả năng đi từ 30-50+ bi ổn định', 2000, 2500, '["Đi được 30-50+ bi ổn định", "Đẳng cấp professional"]', now());