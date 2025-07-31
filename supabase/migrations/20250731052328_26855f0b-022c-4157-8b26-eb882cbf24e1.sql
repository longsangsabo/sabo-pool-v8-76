-- Fix database issues and populate tournament rewards properly
-- Fix tournament_results table structure first
ALTER TABLE tournament_results 
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- Now populate rewards for test tournaments specifically
DO $$
DECLARE
  test1_id UUID := 'c73a66a1-1698-4713-839c-dc62ae3469e5';
  test2_id UUID := '2dc03e3b-9b85-472b-89a1-dd6132ea12a9';
BEGIN
  -- Clear any existing prize tiers for test tournaments
  DELETE FROM tournament_prize_tiers WHERE tournament_id IN (test1_id, test2_id);
  
  -- Insert for test1
  INSERT INTO tournament_prize_tiers (
    tournament_id, position, position_name, cash_amount, elo_points, spa_points, is_visible, physical_items
  ) VALUES
  (test1_id, 1, 'Hạng 1', 0, 100, 500, true, '{}'),
  (test1_id, 2, 'Hạng 2', 0, 90, 400, true, '{}'),
  (test1_id, 3, 'Hạng 3', 0, 80, 350, true, '{}'),
  (test1_id, 4, 'Hạng 4', 0, 70, 300, true, '{}'),
  (test1_id, 5, 'Hạng 5', 0, 60, 250, true, '{}'),
  (test1_id, 6, 'Hạng 6', 0, 50, 200, true, '{}'),
  (test1_id, 7, 'Hạng 7', 0, 40, 180, true, '{}'),
  (test1_id, 8, 'Hạng 8', 0, 35, 160, true, '{}'),
  (test1_id, 9, 'Hạng 9', 0, 30, 140, true, '{}'),
  (test1_id, 10, 'Hạng 10', 0, 25, 120, true, '{}'),
  (test1_id, 11, 'Hạng 11', 0, 20, 100, true, '{}'),
  (test1_id, 12, 'Hạng 12', 0, 18, 90, true, '{}'),
  (test1_id, 13, 'Hạng 13', 0, 15, 80, true, '{}'),
  (test1_id, 14, 'Hạng 14', 0, 12, 70, true, '{}'),
  (test1_id, 15, 'Hạng 15', 0, 10, 60, true, '{}'),
  (test1_id, 16, 'Hạng 16', 0, 8, 50, true, '{}');
  
  -- Insert for test2
  INSERT INTO tournament_prize_tiers (
    tournament_id, position, position_name, cash_amount, elo_points, spa_points, is_visible, physical_items
  ) VALUES
  (test2_id, 1, 'Hạng 1', 0, 100, 500, true, '{}'),
  (test2_id, 2, 'Hạng 2', 0, 90, 400, true, '{}'),
  (test2_id, 3, 'Hạng 3', 0, 80, 350, true, '{}'),
  (test2_id, 4, 'Hạng 4', 0, 70, 300, true, '{}'),
  (test2_id, 5, 'Hạng 5', 0, 60, 250, true, '{}'),
  (test2_id, 6, 'Hạng 6', 0, 50, 200, true, '{}'),
  (test2_id, 7, 'Hạng 7', 0, 40, 180, true, '{}'),
  (test2_id, 8, 'Hạng 8', 0, 35, 160, true, '{}'),
  (test2_id, 9, 'Hạng 9', 0, 30, 140, true, '{}'),
  (test2_id, 10, 'Hạng 10', 0, 25, 120, true, '{}'),
  (test2_id, 11, 'Hạng 11', 0, 20, 100, true, '{}'),
  (test2_id, 12, 'Hạng 12', 0, 18, 90, true, '{}'),
  (test2_id, 13, 'Hạng 13', 0, 15, 80, true, '{}'),
  (test2_id, 14, 'Hạng 14', 0, 12, 70, true, '{}'),
  (test2_id, 15, 'Hạng 15', 0, 10, 60, true, '{}'),
  (test2_id, 16, 'Hạng 16', 0, 8, 50, true, '{}');
  
  RAISE NOTICE 'Successfully populated prize tiers for test1 and test2 tournaments';
END;
$$;