-- Check what rank/verification related tables actually exist
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name ILIKE '%rank%' OR table_name ILIKE '%verif%')
ORDER BY table_name;

-- Also check all tables to see what we have
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;