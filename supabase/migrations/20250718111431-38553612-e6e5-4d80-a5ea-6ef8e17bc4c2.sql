
-- Cập nhật hệ thống tier để đồng nhất: tier_level thấp hơn = hạng thấp hơn
-- K = 1, I = 2, H = 3, G = 4, F = 5, E = 6

-- Cập nhật bảng tournament_tiers
UPDATE tournament_tiers 
SET tier_level = CASE tier_name
  WHEN 'Giải Hạng K' THEN 1
  WHEN 'Giải Hạng I' THEN 2
  WHEN 'Giải Hạng H' THEN 3
  WHEN 'Giải Hạng G' THEN 4
  ELSE tier_level
END;

-- Thêm tier F và E vào tournament_tiers
INSERT INTO tournament_tiers (tier_name, tier_level, points_multiplier, qualification_required, min_participants, description)
VALUES 
  ('Giải Hạng F', 5, 2.5, true, 16, 'Giải đấu chuyên nghiệp'),
  ('Giải Hạng E', 6, 3.0, true, 32, 'Giải đấu chuyên nghiệp cao cấp nhất')
ON CONFLICT (tier_level) DO UPDATE SET
  tier_name = EXCLUDED.tier_name,
  points_multiplier = EXCLUDED.points_multiplier,
  qualification_required = EXCLUDED.qualification_required,
  min_participants = EXCLUDED.min_participants,
  description = EXCLUDED.description;

-- Cập nhật tournament test1 để có tier phù hợp
UPDATE tournaments 
SET 
  tier = 'K',
  tier_level = 1,
  updated_at = now()
WHERE name = 'test1';

-- Cập nhật elo_rules để có tier_level phù hợp cho F và E
INSERT INTO elo_rules (rule_type, condition_key, points_base, points_multiplier, tier_level, description, is_active)
VALUES 
  ('tournament_position', 'champion', 1000, 2.5, 5, 'Vô địch giải hạng F', true),
  ('tournament_position', 'runner_up', 700, 2.5, 5, 'Á quân giải hạng F', true),
  ('tournament_position', 'semi_finalist', 500, 2.5, 5, 'Hạng 3 giải hạng F', true),
  ('tournament_position', 'quarter_finalist', 400, 2.5, 5, 'Hạng 4 giải hạng F', true),
  ('tournament_position', 'top_16', 200, 2.5, 5, 'Top 8 giải hạng F', true),
  ('tournament_position', 'participation', 100, 2.5, 5, 'Tham gia giải hạng F', true),
  
  ('tournament_position', 'champion', 1000, 3.0, 6, 'Vô địch giải hạng E', true),
  ('tournament_position', 'runner_up', 700, 3.0, 6, 'Á quân giải hạng E', true),
  ('tournament_position', 'semi_finalist', 500, 3.0, 6, 'Hạng 3 giải hạng E', true),
  ('tournament_position', 'quarter_finalist', 400, 3.0, 6, 'Hạng 4 giải hạng E', true),
  ('tournament_position', 'top_16', 200, 3.0, 6, 'Top 8 giải hạng E', true),
  ('tournament_position', 'participation', 100, 3.0, 6, 'Tham gia giải hạng E', true)
ON CONFLICT (rule_type, condition_key, tier_level) DO UPDATE SET
  points_base = EXCLUDED.points_base,
  points_multiplier = EXCLUDED.points_multiplier,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;
