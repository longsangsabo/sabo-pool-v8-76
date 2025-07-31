
-- Create districts table (quận/huyện)
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    province_id UUID REFERENCES provinces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create wards table (phường/xã)
CREATE TABLE wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create club_registrations table
CREATE TABLE club_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    club_name VARCHAR(255) NOT NULL,
    club_type VARCHAR(50) NOT NULL, -- new, existing
    existing_club_id UUID REFERENCES clubs(id),
    province_id UUID REFERENCES provinces(id),
    district_id UUID REFERENCES districts(id),
    ward_id UUID REFERENCES wards(id),
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    description TEXT,
    table_count INTEGER DEFAULT 0,
    hourly_rate INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS for new tables
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_registrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for districts (public read)
CREATE POLICY "Anyone can view districts" 
    ON districts 
    FOR SELECT 
    USING (true);

-- RLS policies for wards (public read)
CREATE POLICY "Anyone can view wards" 
    ON wards 
    FOR SELECT 
    USING (true);

-- RLS policies for club_registrations
CREATE POLICY "Users can view their own club registrations" 
    ON club_registrations 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own club registrations" 
    ON club_registrations 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own club registrations" 
    ON club_registrations 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Insert additional provinces
INSERT INTO provinces (name, code, region) VALUES
('Bình Dương', 'BD', 'south'),
('Đồng Nai', 'DNI', 'south'),
('Khánh Hòa', 'KH', 'central'),
('Lâm Đồng', 'LD', 'central')
ON CONFLICT (code) DO NOTHING;

-- Insert districts for TP.HCM
INSERT INTO districts (province_id, name, code) VALUES
((SELECT id FROM provinces WHERE code = 'HCM'), 'Quận 1', 'Q1'),
((SELECT id FROM provinces WHERE code = 'HCM'), 'Quận 2', 'Q2'),
((SELECT id FROM provinces WHERE code = 'HCM'), 'Quận 3', 'Q3'),
((SELECT id FROM provinces WHERE code = 'HCM'), 'Quận 4', 'Q4'),
((SELECT id FROM provinces WHERE code = 'HCM'), 'Quận 5', 'Q5'),
((SELECT id FROM provinces WHERE code = 'HCM'), 'Quận 7', 'Q7'),
((SELECT id FROM provinces WHERE code = 'HCM'), 'Quận 10', 'Q10'),
((SELECT id FROM provinces WHERE code = 'HCM'), 'Quận Bình Thạnh', 'BT'),
((SELECT id FROM provinces WHERE code = 'HCM'), 'Quận Tân Bình', 'TB'),
((SELECT id FROM provinces WHERE code = 'HCM'), 'Quận Phú Nhuận', 'PN');

-- Insert wards for Quận 1
INSERT INTO wards (district_id, name, code) VALUES
((SELECT id FROM districts WHERE code = 'Q1'), 'Phường Bến Nghé', 'BN'),
((SELECT id FROM districts WHERE code = 'Q1'), 'Phường Bến Thành', 'BT'),
((SELECT id FROM districts WHERE code = 'Q1'), 'Phường Cầu Kho', 'CK'),
((SELECT id FROM districts WHERE code = 'Q1'), 'Phường Cầu Ông Lãnh', 'COL'),
((SELECT id FROM districts WHERE code = 'Q1'), 'Phường Cô Giang', 'CG'),
((SELECT id FROM districts WHERE code = 'Q1'), 'Phường Đa Kao', 'DK'),
((SELECT id FROM districts WHERE code = 'Q1'), 'Phường Nguyễn Cư Trinh', 'NCT'),
((SELECT id FROM districts WHERE code = 'Q1'), 'Phường Nguyễn Thái Bình', 'NTB'),
((SELECT id FROM districts WHERE code = 'Q1'), 'Phường Phạm Ngũ Lão', 'PNL'),
((SELECT id FROM districts WHERE code = 'Q1'), 'Phường Tân Định', 'TD');

-- Insert districts for Bà Rịa - Vũng Tàu
INSERT INTO districts (province_id, name, code) VALUES
((SELECT id FROM provinces WHERE code = 'BRVT'), 'TP Vũng Tàu', 'VT'),
((SELECT id FROM provinces WHERE code = 'BRVT'), 'TP Bà Rịa', 'BR'),
((SELECT id FROM provinces WHERE code = 'BRVT'), 'Huyện Côn Đảo', 'CD'),
((SELECT id FROM provinces WHERE code = 'BRVT'), 'Huyện Long Điền', 'LD'),
((SELECT id FROM provinces WHERE code = 'BRVT'), 'Huyện Đất Đỏ', 'DD');

-- Insert wards for TP Vũng Tàu
INSERT INTO wards (district_id, name, code) VALUES
((SELECT id FROM districts WHERE name = 'TP Vũng Tàu'), 'Phường 1', 'P1'),
((SELECT id FROM districts WHERE name = 'TP Vũng Tàu'), 'Phường 2', 'P2'),
((SELECT id FROM districts WHERE name = 'TP Vũng Tàu'), 'Phường 3', 'P3'),
((SELECT id FROM districts WHERE name = 'TP Vũng Tàu'), 'Phường 4', 'P4'),
((SELECT id FROM districts WHERE name = 'TP Vũng Tàu'), 'Phường 5', 'P5'),
((SELECT id FROM districts WHERE name = 'TP Vũng Tàu'), 'Phường 7', 'P7'),
((SELECT id FROM districts WHERE name = 'TP Vũng Tàu'), 'Phường 8', 'P8'),
((SELECT id FROM districts WHERE name = 'TP Vũng Tàu'), 'Phường 9', 'P9'),
((SELECT id FROM districts WHERE name = 'TP Vũng Tàu'), 'Phường 10', 'P10'),
((SELECT id FROM districts WHERE name = 'TP Vũng Tàu'), 'Phường 11', 'P11'),
((SELECT id FROM districts WHERE name = 'TP Vũng Tàu'), 'Phường 12', 'P12');

-- Insert SABO Billiards - TP Vũng Tàu
INSERT INTO clubs (name, address, phone, email, hourly_rate, table_count, description, province_id, status, created_at) VALUES
('SABO Billiards - TP Vũng Tàu', 
 '123 Đường Hạ Long, Phường 1, TP Vũng Tàu', 
 '0254123456', 
 'contact@sabobilliards.vn', 
 80000, 
 12, 
 'Câu lạc bộ bida hàng đầu tại Vũng Tàu với trang thiết bị hiện đại và không gian thoáng mát',
 (SELECT id FROM provinces WHERE code = 'BRVT'),
 'active',
 NOW());

-- Insert sample clubs
INSERT INTO clubs (name, address, phone, hourly_rate, table_count, description, province_id, status, created_at) VALUES
('CLB Bida Sài Gòn Center', '456 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM', '0281234567', 90000, 15, 'CLB bida cao cấp tại trung tâm Sài Gòn', (SELECT id FROM provinces WHERE code = 'HCM'), 'active', NOW()),
('CLB Bida Hà Nội Royal', '789 Hoàn Kiếm, Hà Nội', '0241234567', 85000, 10, 'CLB bida sang trọng tại Hà Nội', (SELECT id FROM provinces WHERE code = 'HN'), 'active', NOW()),
('CLB Bida Đà Nẵng Beach', '321 Hải Châu, Đà Nẵng', '0236123456', 70000, 8, 'CLB bida view biển tại Đà Nẵng', (SELECT id FROM provinces WHERE code = 'DN'), 'active', NOW()),
('CLB Bida Cần Thơ Mekong', '654 Ninh Kiều, Cần Thơ', '0292123456', 60000, 6, 'CLB bida uy tín tại miền Tây', (SELECT id FROM provinces WHERE code = 'CT'), 'active', NOW()),
('CLB Bida Hải Phòng Port', '987 Hồng Bàng, Hải Phòng', '0225123456', 75000, 9, 'CLB bida chuyên nghiệp tại Hải Phòng', (SELECT id FROM provinces WHERE code = 'HP'), 'active', NOW()),
('CLB Bida Bình Dương New City', '147 Thủ Dầu Một, Bình Dương', '0274123456', 65000, 7, 'CLB bida hiện đại tại Bình Dương', (SELECT id FROM provinces WHERE code = 'BD'), 'active', NOW()),
('CLB Bida Đồng Nai Green', '258 Biên Hòa, Đồng Nai', '0251123456', 55000, 5, 'CLB bida xanh sạch đẹp tại Đồng Nai', (SELECT id FROM provinces WHERE code = 'DNI'), 'active', NOW()),
('CLB Bida Nha Trang Ocean', '369 Nha Trang, Khánh Hòa', '0258123456', 80000, 11, 'CLB bida view biển tại Nha Trang', (SELECT id FROM provinces WHERE code = 'KH'), 'active', NOW()),
('CLB Bida Đà Lạt Highland', '741 Đà Lạt, Lâm Đồng', '0263123456', 70000, 8, 'CLB bida thành phố ngàn hoa', (SELECT id FROM provinces WHERE code = 'LD'), 'active', NOW()),
('CLB Bida Vũng Tàu Seaside', '852 Thùy Vân, TP Vũng Tàu', '0254987654', 75000, 10, 'CLB bida ven biển tại Vũng Tàu', (SELECT id FROM provinces WHERE code = 'BRVT'), 'active', NOW());
