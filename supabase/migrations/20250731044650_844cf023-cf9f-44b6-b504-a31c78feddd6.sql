-- Apply reward template to test1 tournament manually
INSERT INTO public.tournament_prize_tiers (
  tournament_id,
  position,
  position_name,
  cash_amount,
  elo_points,
  spa_points,
  is_visible,
  physical_items
)
VALUES 
  ('c73a66a1-1698-4713-839c-dc62ae3469e5', 1, 'Vô địch', 1100000, 100, 900, true, '{}'),
  ('c73a66a1-1698-4713-839c-dc62ae3469e5', 2, 'Á quân', 660000, 75, 700, true, '{}'),
  ('c73a66a1-1698-4713-839c-dc62ae3469e5', 3, 'Hạng 3', 440000, 50, 500, true, '{}');

-- Verify the data was inserted
SELECT 
  tournament_id,
  position,
  position_name,
  cash_amount,
  elo_points,
  spa_points,
  is_visible
FROM tournament_prize_tiers 
WHERE tournament_id = 'c73a66a1-1698-4713-839c-dc62ae3469e5'
ORDER BY position;