-- Check the tournaments table structure to see available columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tournaments'
ORDER BY ordinal_position;