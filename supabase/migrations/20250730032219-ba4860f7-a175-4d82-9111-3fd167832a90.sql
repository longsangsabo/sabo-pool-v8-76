-- Check the actual column names in tournament_matches table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tournament_matches' 
  AND table_schema = 'public'
ORDER BY ordinal_position;