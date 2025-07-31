-- Insert default prize tiers for sabo111 tournament based on the screenshot
INSERT INTO tournament_prize_tiers (
  tournament_id,
  position,
  position_name,
  cash_amount,
  elo_points,
  spa_points,
  is_visible,
  physical_items
) VALUES 
-- Position 1: Vô địch
('7d4d4ce6-2832-49bd-9ac4-2003b7275d43', 1, 'Vô địch', 0, 100, 1000, true, '["Giấy chứng nhận"]'),
-- Position 2: Á quân  
('7d4d4ce6-2832-49bd-9ac4-2003b7275d43', 2, 'Á quân', 0, 75, 800, true, '["Giấy chứng nhận"]'),
-- Position 3: Hạng 3
('7d4d4ce6-2832-49bd-9ac4-2003b7275d43', 3, 'Hạng 3', 0, 50, 600, true, '["Giấy chứng nhận"]'),
-- Position 4: Hạng 4
('7d4d4ce6-2832-49bd-9ac4-2003b7275d43', 4, 'Hạng 4', 0, 25, 300, true, '[]');