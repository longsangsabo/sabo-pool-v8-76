-- Check what tables exist that contain user data
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%ranking%' OR table_name LIKE '%user%' OR table_name LIKE '%profile%' OR table_name LIKE '%player%'
ORDER BY table_name;