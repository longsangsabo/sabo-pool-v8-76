-- Populate tournament test2 with 16 positions reward structure
WITH test2_tournament AS (
  SELECT id FROM tournaments WHERE name = 'test2' LIMIT 1
),
reward_positions AS (
  SELECT * FROM (VALUES
    (1, 'Vô địch', 4000000, 100, 900, true, '["Cúp vô địch"]'::jsonb),
    (2, 'Á quân', 2400000, 75, 700, true, '["Huy chương bạc"]'::jsonb),
    (3, 'Hạng 3', 1600000, 50, 500, true, '["Huy chương đồng"]'::jsonb),
    (4, 'Hạng 4', 800000, 40, 350, true, '[]'::jsonb),
    (5, 'Hạng 5-6', 400000, 30, 120, true, '[]'::jsonb),
    (6, 'Hạng 5-6', 400000, 30, 120, true, '[]'::jsonb),
    (7, 'Hạng 7-8', 200000, 25, 120, true, '[]'::jsonb),
    (8, 'Hạng 7-8', 200000, 25, 120, true, '[]'::jsonb),
    (9, 'Hạng 9-12', 112500, 20, 120, true, '[]'::jsonb),
    (10, 'Hạng 9-12', 112500, 20, 120, true, '[]'::jsonb),
    (11, 'Hạng 9-12', 112500, 20, 120, true, '[]'::jsonb),
    (12, 'Hạng 9-12', 112500, 20, 120, true, '[]'::jsonb),
    (13, 'Hạng 13-16', 56250, 15, 120, true, '[]'::jsonb),
    (14, 'Hạng 13-16', 56250, 15, 120, true, '[]'::jsonb),
    (15, 'Hạng 13-16', 56250, 15, 120, true, '[]'::jsonb),
    (16, 'Hạng 13-16', 56250, 15, 120, true, '[]'::jsonb)
  ) AS t(position, position_name, cash_amount, elo_points, spa_points, is_visible, physical_items)
)
INSERT INTO tournament_prize_tiers (
  tournament_id, 
  position, 
  position_name, 
  cash_amount, 
  elo_points, 
  spa_points, 
  is_visible, 
  physical_items
)
SELECT 
  t2.id,
  rp.position,
  rp.position_name,
  rp.cash_amount,
  rp.elo_points,
  rp.spa_points,
  rp.is_visible,
  rp.physical_items
FROM test2_tournament t2, reward_positions rp
ON CONFLICT (tournament_id, position) DO UPDATE SET
  position_name = EXCLUDED.position_name,
  cash_amount = EXCLUDED.cash_amount,
  elo_points = EXCLUDED.elo_points,
  spa_points = EXCLUDED.spa_points,
  is_visible = EXCLUDED.is_visible,
  physical_items = EXCLUDED.physical_items;

-- Update tournament test2 to have a proper prize pool
UPDATE tournaments 
SET 
  prize_pool = 10000000,
  updated_at = NOW()
WHERE name = 'test2';