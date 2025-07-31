-- Check if tournament_prize_tiers table exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tournament_prize_tiers' 
AND table_schema = 'public'
ORDER BY ordinal_position;