-- Fix tournament prize tier position names to be clear individual positions
UPDATE tournament_prize_tiers 
SET position_name = CASE 
  WHEN position = 1 THEN 'Hạng 1'
  WHEN position = 2 THEN 'Hạng 2' 
  WHEN position = 3 THEN 'Hạng 3'
  WHEN position = 4 THEN 'Hạng 4'
  WHEN position = 5 THEN 'Hạng 5'
  WHEN position = 6 THEN 'Hạng 6'
  WHEN position = 7 THEN 'Hạng 7'
  WHEN position = 8 THEN 'Hạng 8'
  WHEN position = 9 THEN 'Hạng 9'
  WHEN position = 10 THEN 'Hạng 10'
  WHEN position = 11 THEN 'Hạng 11'
  WHEN position = 12 THEN 'Hạng 12'
  WHEN position = 13 THEN 'Hạng 13'
  WHEN position = 14 THEN 'Hạng 14'
  WHEN position = 15 THEN 'Hạng 15'
  WHEN position = 16 THEN 'Hạng 16'
  ELSE position_name
END
WHERE tournament_id IN (SELECT id FROM tournaments WHERE name = 'test2');