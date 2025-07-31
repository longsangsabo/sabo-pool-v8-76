-- Update test1 tournament with sample times and ensure correct display
UPDATE tournaments 
SET 
  tournament_start = '2024-12-25 09:00:00+07',
  tournament_end = '2024-12-25 18:00:00+07',
  updated_at = now()
WHERE name = 'test1';