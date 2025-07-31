
-- Fix tournament test5 data inconsistency - remove the extra registration
-- First, let's check and remove duplicate or excess registrations for test5 tournament
DELETE FROM tournament_registrations 
WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b'
AND id NOT IN (
  SELECT id FROM tournament_registrations 
  WHERE tournament_id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b'
  AND payment_status = 'paid'
  ORDER BY created_at ASC
  LIMIT 16
);

-- Update tournament current_participants count to be accurate
UPDATE tournaments 
SET current_participants = (
  SELECT COUNT(*) FROM tournament_registrations 
  WHERE tournament_id = tournaments.id 
  AND payment_status = 'paid'
)
WHERE id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b';

-- Add missing prize distribution columns if they don't exist
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS prize_distribution jsonb DEFAULT '{}';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS physical_prizes jsonb DEFAULT '[]';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS spa_points_config jsonb DEFAULT '{}';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS elo_points_config jsonb DEFAULT '{}';

-- Update test5 tournament with sample prize data
UPDATE tournaments 
SET 
  prize_distribution = '{"1": 2000000, "2": 1000000, "3": 500000, "participation": 50000}',
  physical_prizes = '[{"position": 1, "items": ["Cúp vô địch", "Huy chương vàng"]}, {"position": 2, "items": ["Huy chương bạc"]}, {"position": 3, "items": ["Huy chương đồng"]}]',
  spa_points_config = '{"winner": 100, "runner_up": 80, "third_place": 60, "participation": 20}',
  elo_points_config = '{"k_factor": 32, "tournament_multiplier": 1.5}'
WHERE id = 'e9c37e3b-a598-4b71-b6a6-6362c678441b';
