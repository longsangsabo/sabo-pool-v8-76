-- Check if rank_verifications table exists and what columns it has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rank_verifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;